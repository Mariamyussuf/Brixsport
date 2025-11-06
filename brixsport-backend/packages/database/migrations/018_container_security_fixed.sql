-- Container Security Migration (Fixed Version)
-- This migration adds tables for container security scanning, monitoring, and policy enforcement

-- =============================================================================
-- CONTAINER SECURITY SCANNING
-- =============================================================================

-- Container Scan Results table
CREATE TABLE IF NOT EXISTS container_scan_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    image VARCHAR(255) NOT NULL,
    vulnerabilities JSONB NOT NULL DEFAULT '[]',
    scan_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    scanner_tool VARCHAR(100), -- 'trivy', 'clair', 'anchore', etc.
    scanner_version VARCHAR(50),
    duration_ms INTEGER, -- Scan duration in milliseconds
    status VARCHAR(20) DEFAULT 'completed', -- 'pending', 'running', 'completed', 'failed'
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for container_scan_results
CREATE INDEX IF NOT EXISTS idx_container_scan_results_image ON container_scan_results(image);
CREATE INDEX IF NOT EXISTS idx_container_scan_results_scan_date ON container_scan_results(scan_date);
CREATE INDEX IF NOT EXISTS idx_container_scan_results_status ON container_scan_results(status);
CREATE INDEX IF NOT EXISTS idx_container_scan_results_created_at ON container_scan_results(created_at);

-- Container Audit table
CREATE TABLE IF NOT EXISTS container_audits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    container_id VARCHAR(255) NOT NULL,
    image VARCHAR(255) NOT NULL,
    issues JSONB NOT NULL DEFAULT '[]',
    scan_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    auditor_tool VARCHAR(100), -- 'docker-bench', 'kube-bench', 'cis-benchmark', etc.
    auditor_version VARCHAR(50),
    duration_ms INTEGER, -- Audit duration in milliseconds
    status VARCHAR(20) DEFAULT 'completed', -- 'pending', 'running', 'completed', 'failed'
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for container_audits
CREATE INDEX IF NOT EXISTS idx_container_audits_container_id ON container_audits(container_id);
CREATE INDEX IF NOT EXISTS idx_container_audits_image ON container_audits(image);
CREATE INDEX IF NOT EXISTS idx_container_audits_scan_date ON container_audits(scan_date);
CREATE INDEX IF NOT EXISTS idx_container_audits_status ON container_audits(status);
CREATE INDEX IF NOT EXISTS idx_container_audits_created_at ON container_audits(created_at);

-- Container Security Policies table
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

-- Create indexes for container_security_policies
CREATE INDEX IF NOT EXISTS idx_container_security_policies_name ON container_security_policies(name);
CREATE INDEX IF NOT EXISTS idx_container_security_policies_policy_type ON container_security_policies(policy_type);
CREATE INDEX IF NOT EXISTS idx_container_security_policies_enabled ON container_security_policies(enabled);
CREATE INDEX IF NOT EXISTS idx_container_security_policies_enforcement_mode ON container_security_policies(enforcement_mode);
CREATE INDEX IF NOT EXISTS idx_container_security_policies_created_at ON container_security_policies(created_at);

-- Ensure unique constraint exists for container_security_policies name
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'container_security_policies' 
    AND constraint_type = 'UNIQUE' 
    AND constraint_name = 'container_security_policies_name_key'
  ) THEN
    ALTER TABLE container_security_policies ADD CONSTRAINT container_security_policies_name_key UNIQUE (name);
  END IF;
EXCEPTION
  WHEN duplicate_table OR duplicate_constraint THEN
    -- Constraint already exists, do nothing
    NULL;
END $$;

-- Container Runtime Monitoring table
CREATE TABLE IF NOT EXISTS container_runtime_monitoring (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    container_id VARCHAR(255) NOT NULL,
    image VARCHAR(255) NOT NULL,
    monitoring_tool VARCHAR(100), -- 'falco', 'sysdig', 'aqua', etc.
    monitoring_version VARCHAR(50),
    events JSONB NOT NULL DEFAULT '[]', -- Security events detected
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'stopped', 'completed'
    metrics JSONB, -- Runtime metrics
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for container_runtime_monitoring
CREATE INDEX IF NOT EXISTS idx_container_runtime_monitoring_container_id ON container_runtime_monitoring(container_id);
CREATE INDEX IF NOT EXISTS idx_container_runtime_monitoring_image ON container_runtime_monitoring(image);
CREATE INDEX IF NOT EXISTS idx_container_runtime_monitoring_monitoring_tool ON container_runtime_monitoring(monitoring_tool);
CREATE INDEX IF NOT EXISTS idx_container_runtime_monitoring_status ON container_runtime_monitoring(status);
CREATE INDEX IF NOT EXISTS idx_container_runtime_monitoring_start_time ON container_runtime_monitoring(start_time);
CREATE INDEX IF NOT EXISTS idx_container_runtime_monitoring_created_at ON container_runtime_monitoring(created_at);

-- Container Vulnerability Statistics table
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

-- Create indexes for container_vulnerability_stats
CREATE INDEX IF NOT EXISTS idx_container_vulnerability_stats_stat_date ON container_vulnerability_stats(stat_date);
CREATE INDEX IF NOT EXISTS idx_container_vulnerability_stats_created_at ON container_vulnerability_stats(created_at);

-- Ensure unique constraint exists for container_vulnerability_stats stat_date
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'container_vulnerability_stats' 
    AND constraint_type = 'UNIQUE' 
    AND constraint_name = 'container_vulnerability_stats_stat_date_key'
  ) THEN
    ALTER TABLE container_vulnerability_stats ADD CONSTRAINT container_vulnerability_stats_stat_date_key UNIQUE (stat_date);
  END IF;
EXCEPTION
  WHEN duplicate_table OR duplicate_constraint THEN
    -- Constraint already exists, do nothing
    NULL;
END $$;

-- =============================================================================
-- SECURITY FUNCTIONS
-- =============================================================================

-- Function to update vulnerability statistics
CREATE OR REPLACE FUNCTION update_vulnerability_statistics()
RETURNS VOID AS $$
DECLARE
    stat_date DATE := CURRENT_DATE;
    total_vulns INTEGER;
    critical_vulns INTEGER;
    high_vulns INTEGER;
    medium_vulns INTEGER;
    low_vulns INTEGER;
    total_images INTEGER;
    vulnerable_images INTEGER;
BEGIN
    -- Count total vulnerabilities
    SELECT 
        COUNT(*) FILTER (WHERE v.severity = 'critical') AS critical,
        COUNT(*) FILTER (WHERE v.severity = 'high') AS high,
        COUNT(*) FILTER (WHERE v.severity = 'medium') AS medium,
        COUNT(*) FILTER (WHERE v.severity = 'low') AS low,
        COUNT(*) AS total
    INTO critical_vulns, high_vulns, medium_vulns, low_vulns, total_vulns
    FROM container_scan_results csr,
    LATERAL jsonb_to_recordset(csr.vulnerabilities) AS v(severity TEXT)
    WHERE csr.scan_date >= CURRENT_DATE AND csr.scan_date < CURRENT_DATE + INTERVAL '1 day';
    
    -- Count images
    SELECT 
        COUNT(DISTINCT image) AS total,
        COUNT(DISTINCT CASE WHEN jsonb_array_length(vulnerabilities) > 0 THEN image END) AS vulnerable
    INTO total_images, vulnerable_images
    FROM container_scan_results
    WHERE scan_date >= CURRENT_DATE AND scan_date < CURRENT_DATE + INTERVAL '1 day';
    
    -- Insert or update statistics
    INSERT INTO container_vulnerability_stats (
        stat_date, total_vulnerabilities, critical_count, high_count, 
        medium_count, low_count, scanned_images, vulnerable_images
    ) VALUES (
        stat_date, total_vulns, critical_vulns, high_vulns, 
        medium_vulns, low_vulns, total_images, vulnerable_images
    )
    ON CONFLICT (stat_date) 
    DO UPDATE SET
        total_vulnerabilities = EXCLUDED.total_vulnerabilities,
        critical_count = EXCLUDED.critical_count,
        high_count = EXCLUDED.high_count,
        medium_count = EXCLUDED.medium_count,
        low_count = EXCLUDED.low_count,
        scanned_images = EXCLUDED.scanned_images,
        vulnerable_images = EXCLUDED.vulnerable_images,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old container security data
CREATE OR REPLACE FUNCTION cleanup_container_security_data(p_days_to_keep INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER := 0;
    temp_count INTEGER;
BEGIN
    -- Clean up old scan results
    DELETE FROM container_scan_results 
    WHERE created_at < NOW() - (p_days_to_keep || ' days')::INTERVAL;
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    deleted_count := deleted_count + temp_count;
    
    -- Clean up old audits
    DELETE FROM container_audits 
    WHERE created_at < NOW() - (p_days_to_keep || ' days')::INTERVAL;
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    deleted_count := deleted_count + temp_count;
    
    -- Clean up old runtime monitoring data
    DELETE FROM container_runtime_monitoring 
    WHERE created_at < NOW() - (p_days_to_keep || ' days')::INTERVAL;
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    deleted_count := deleted_count + temp_count;
    
    -- Log the cleanup activity
    INSERT INTO "AuditLog" (user_id, action, entity_type, new_values)
    VALUES (
        '00000000-0000-0000-0000-000000000000'::uuid,
        'container_security_data_cleanup',
        'system',
        jsonb_build_object(
            'deleted_records', deleted_count,
            'retention_days', p_days_to_keep,
            'cleanup_date', NOW()
        )
    );
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- CONSTRAINTS AND VALIDATION
-- =============================================================================

-- Add constraints for container security tables
ALTER TABLE container_scan_results ADD CONSTRAINT check_scan_result_status 
CHECK (status IN ('pending', 'running', 'completed', 'failed'));

ALTER TABLE container_audits ADD CONSTRAINT check_audit_status 
CHECK (status IN ('pending', 'running', 'completed', 'failed'));

ALTER TABLE container_security_policies ADD CONSTRAINT check_policy_enforcement_mode 
CHECK (enforcement_mode IN ('enforce', 'audit', 'warn'));

ALTER TABLE container_runtime_monitoring ADD CONSTRAINT check_monitoring_status 
CHECK (status IN ('active', 'stopped', 'completed'));

-- Add table comments
COMMENT ON TABLE container_scan_results IS 'Container image vulnerability scan results';
COMMENT ON TABLE container_audits IS 'Container configuration and security audits';
COMMENT ON TABLE container_security_policies IS 'Container security policies for enforcement';
COMMENT ON TABLE container_runtime_monitoring IS 'Container runtime security monitoring events';
COMMENT ON TABLE container_vulnerability_stats IS 'Daily container vulnerability statistics';

COMMENT ON FUNCTION update_vulnerability_statistics IS 'Update daily vulnerability statistics from scan results';
COMMENT ON FUNCTION cleanup_container_security_data IS 'Clean up old container security data based on retention policies';

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