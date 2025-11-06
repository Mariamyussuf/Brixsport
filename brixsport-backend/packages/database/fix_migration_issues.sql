-- Fix for migration issues

-- First, let's add the missing notification_type column to notification_preferences if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notification_preferences' 
    AND column_name = 'notification_type'
  ) THEN
    ALTER TABLE notification_preferences ADD COLUMN notification_type VARCHAR(100) NOT NULL DEFAULT 'general';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    -- Handle any other exceptions
    RAISE NOTICE 'Error adding notification_type column: %', SQLERRM;
END $$;

-- Now let's fix the function that was failing
-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS create_notification(UUID, VARCHAR, VARCHAR, TEXT, JSONB, VARCHAR[], VARCHAR, VARCHAR, VARCHAR, UUID, TIMESTAMP WITH TIME ZONE);

-- Recreate the function with proper handling
CREATE OR REPLACE FUNCTION create_notification(
    p_user_id UUID,
    p_type VARCHAR,
    p_title VARCHAR,
    p_message TEXT,
    p_data JSONB DEFAULT NULL,
    p_channels VARCHAR[] DEFAULT ARRAY['in_app'],
    p_priority VARCHAR DEFAULT 'normal',
    p_category VARCHAR DEFAULT NULL,
    p_source_type VARCHAR DEFAULT NULL,
    p_source_id UUID DEFAULT NULL,
    p_scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS UUID AS $$
DECLARE
    notification_id UUID;
    user_prefs RECORD;
    should_send BOOLEAN := TRUE;
BEGIN
    -- Check user preferences (with proper column reference)
    SELECT INTO user_prefs
        enabled, frequency, quiet_hours_start, quiet_hours_end
    FROM notification_preferences
    WHERE user_id = p_user_id 
    AND notification_type = p_type 
    AND channel = ANY(p_channels)
    LIMIT 1;
    
    -- Check if notifications are enabled for this type
    IF FOUND AND NOT user_prefs.enabled THEN
        should_send := FALSE;
    END IF;
    
    -- Check quiet hours (simplified - assumes user timezone is handled elsewhere)
    IF FOUND AND user_prefs.quiet_hours_start IS NOT NULL AND user_prefs.quiet_hours_end IS NOT NULL THEN
        IF EXTRACT(HOUR FROM p_scheduled_for) BETWEEN 
           EXTRACT(HOUR FROM user_prefs.quiet_hours_start) AND 
           EXTRACT(HOUR FROM user_prefs.quiet_hours_end) THEN
            -- Reschedule for after quiet hours
            p_scheduled_for := p_scheduled_for + INTERVAL '8 hours';
        END IF;
    END IF;
    
    -- Create the notification
    INSERT INTO notifications (
        user_id, type, title, message, data, channels, priority, category,
        source_type, source_id, scheduled_for, status
    ) VALUES (
        p_user_id, p_type, p_title, p_message, p_data, p_channels, p_priority, p_category,
        p_source_type, p_source_id, p_scheduled_for, 
        CASE WHEN should_send THEN 'pending' ELSE 'suppressed' END
    ) RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$ LANGUAGE plpgsql;

-- For the container security policies, let's ensure the table exists and has the proper constraints
-- Create the table if it doesn't exist
CREATE TABLE IF NOT EXISTS container_security_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    policy_type VARCHAR(100) NOT NULL, -- 'kubernetes', 'docker', 'image', 'runtime'
    policy_data JSONB NOT NULL, -- Actual policy content
    enabled BOOLEAN DEFAULT TRUE,
    enforcement_mode VARCHAR(20) DEFAULT 'enforce', -- 'enforce', 'audit', 'warn'
    target_resources JSONB DEFAULT '[]', -- Resources this policy applies to
    created_by UUID REFERENCES "User"(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES "User"(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure unique constraint exists for container_security_policies name
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'container_security_policies_name_key'
  ) THEN
    ALTER TABLE container_security_policies ADD CONSTRAINT container_security_policies_name_key UNIQUE (name);
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    -- Handle any other exceptions
    RAISE NOTICE 'Error adding unique constraint: %', SQLERRM;
END $$;

-- Also ensure the container_vulnerability_stats table has the unique constraint
-- Create the table if it doesn't exist
CREATE TABLE IF NOT EXISTS container_vulnerability_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stat_date DATE NOT NULL,
    total_vulnerabilities INTEGER NOT NULL DEFAULT 0,
    critical_count INTEGER NOT NULL DEFAULT 0,
    high_count INTEGER NOT NULL DEFAULT 0,
    medium_count INTEGER NOT NULL DEFAULT 0,
    low_count INTEGER NOT NULL DEFAULT 0,
    scanned_images INTEGER NOT NULL DEFAULT 0,
    vulnerable_images INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure unique constraint exists for container_vulnerability_stats stat_date
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'container_vulnerability_stats_stat_date_key'
  ) THEN
    ALTER TABLE container_vulnerability_stats ADD CONSTRAINT container_vulnerability_stats_stat_date_key UNIQUE (stat_date);
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    -- Handle any other exceptions
    RAISE NOTICE 'Error adding unique constraint: %', SQLERRM;
END $$;

-- Now we can safely insert the default policies
-- Insert default security policies with conflict handling
INSERT INTO container_security_policies (name, description, policy_type, policy_data, enforcement_mode) VALUES
('no-root-containers', 'Prevent containers from running as root user', 'kubernetes', 
'{
  "apiVersion": "kyverno.io/v1",
  "kind": "ClusterPolicy",
  "metadata": {
    "name": "require-non-root-user"
  },
  "spec": {
    "validationFailureAction": "enforce",
    "background": true,
    "rules": [
      {
        "name": "check-runasnonroot",
        "match": {
          "resources": {
            "kinds": [
              "Pod"
            ]
          }
        },
        "validate": {
          "message": "Running as root is not allowed. Set runAsNonRoot to true.",
          "anyPattern": [
            {
              "spec": {
                "=(securityContext)": {
                  "=(runAsNonRoot)": true
                }
              }
            },
            {
              "spec": {
                "containers": [
                  {
                    "=(securityContext)": {
                      "=(runAsNonRoot)": true
                    }
                  }
                ]
              }
            }
          ]
        }
      }
    ]
  }
}', 'enforce')
ON CONFLICT (name) DO NOTHING;

INSERT INTO container_security_policies (name, description, policy_type, policy_data, enforcement_mode) VALUES
('read-only-root-filesystem', 'Enforce read-only root filesystem for containers', 'kubernetes',
'{
  "apiVersion": "kyverno.io/v1",
  "kind": "ClusterPolicy",
  "metadata": {
    "name": "require-readonly-rootfs"
  },
  "spec": {
    "validationFailureAction": "enforce",
    "background": true,
    "rules": [
      {
        "name": "validate-readOnlyRootFilesystem",
        "match": {
          "resources": {
            "kinds": [
              "Pod"
            ]
          }
        },
        "validate": {
          "message": "Root filesystem must be read-only.",
          "pattern": {
            "spec": {
              "containers": [
                {
                  "securityContext": {
                    "readOnlyRootFilesystem": true
                  }
                }
              ]
            }
          }
        }
      }
    ]
  }
}', 'enforce')
ON CONFLICT (name) DO NOTHING;

INSERT INTO container_security_policies (name, description, policy_type, policy_data, enforcement_mode) VALUES
('drop-capabilities', 'Drop unnecessary Linux capabilities from containers', 'kubernetes',
'{
  "apiVersion": "kyverno.io/v1",
  "kind": "ClusterPolicy",
  "metadata": {
    "name": "drop-capabilities"
  },
  "spec": {
    "validationFailureAction": "enforce",
    "background": true,
    "rules": [
      {
        "name": "drop-capabilities",
        "match": {
          "resources": {
            "kinds": [
              "Pod"
            ]
          }
        },
        "validate": {
          "message": "Containers must drop ALL capabilities and only add back required ones.",
          "pattern": {
            "spec": {
              "containers": [
                {
                  "securityContext": {
                    "capabilities": {
                      "drop": [
                        "ALL"
                      ]
                    }
                  }
                }
              ]
            }
          }
        }
      }
    ]
  }
}', 'enforce')
ON CONFLICT (name) DO NOTHING;