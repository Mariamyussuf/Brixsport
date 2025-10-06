import { validationService, ValidationSchema } from '../../../services/security/validation.service';

// Mock Redis service
jest.mock('../../../services/redis.service', () => ({
  redisService: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn()
  }
}));

// Mock Supabase service
jest.mock('../../../services/supabase.service', () => ({
  supabaseService: {
    supabase: {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn()
    }
  }
}));

describe('Validation Service', () => {
  describe('validateInput', () => {
    it('should validate required string field', async () => {
      const schema: ValidationSchema<{ name: string }> = {
        fields: {
          name: { type: 'string', required: true }
        }
      };
      
      const result = await validationService.validateInput({ name: 'John' }, schema);
      
      expect(result.isValid).toBe(true);
      expect(result.data.name).toBe('John');
    });

    it('should reject missing required field', async () => {
      const schema: ValidationSchema<{ name: string }> = {
        fields: {
          name: { type: 'string', required: true }
        }
      };
      
      const result = await validationService.validateInput({}, schema);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('name');
      expect(result.errors[0].code).toBe('required');
    });

    it('should validate email format', async () => {
      const schema: ValidationSchema<{ email: string }> = {
        fields: {
          email: { type: 'email', required: true }
        }
      };
      
      const result = await validationService.validateInput({ email: 'test@example.com' }, schema);
      
      expect(result.isValid).toBe(true);
      expect(result.data.email).toBe('test@example.com');
    });

    it('should reject invalid email format', async () => {
      const schema: ValidationSchema<{ email: string }> = {
        fields: {
          email: { type: 'email', required: true }
        }
      };
      
      const result = await validationService.validateInput({ email: 'invalid-email' }, schema);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('email');
      expect(result.errors[0].code).toBe('invalid_email');
    });

    it('should validate number range', async () => {
      const schema: ValidationSchema<{ age: number }> = {
        fields: {
          age: { type: 'number', required: true, min: 18, max: 120 }
        }
      };
      
      const result = await validationService.validateInput({ age: 25 }, schema);
      
      expect(result.isValid).toBe(true);
      expect(result.data.age).toBe(25);
    });

    it('should reject number below minimum', async () => {
      const schema: ValidationSchema<{ age: number }> = {
        fields: {
          age: { type: 'number', required: true, min: 18, max: 120 }
        }
      };
      
      const result = await validationService.validateInput({ age: 15 }, schema);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('age');
      expect(result.errors[0].code).toBe('min_value');
    });

    it('should sanitize input when requested', async () => {
      const schema: ValidationSchema<{ name: string }> = {
        fields: {
          name: { type: 'string', required: true, sanitize: true }
        }
      };
      
      const result = await validationService.validateInput({ name: 'John <script>alert("xss")</script>' }, schema);
      
      expect(result.isValid).toBe(true);
      expect(result.data.name).toBe('John &lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
    });
  });

  describe('sanitizeHTML', () => {
    it('should sanitize HTML content', async () => {
      const html = '<p>Hello <script>alert("xss")</script> World</p>';
      const sanitized = await validationService.sanitizeHTML(html);
      
      expect(sanitized).toBe('<p>Hello  World</p>');
    });
  });

  describe('validatePhone', () => {
    it('should validate valid phone number', async () => {
      const result = await validationService.validatePhone('+1-555-123-4567');
      
      expect(result).toBe(true);
    });

    it('should reject invalid phone number', async () => {
      const result = await validationService.validatePhone('invalid-phone');
      
      expect(result).toBe(false);
    });
  });

  describe('validateJSON', () => {
    it('should validate valid JSON string', async () => {
      const jsonString = '{"name": "John", "age": 30}';
      const result = await validationService.validateJSON(jsonString);
      
      expect(result).toEqual({ name: 'John', age: 30 });
    });

    it('should reject invalid JSON string', async () => {
      const jsonString = '{"name": "John", "age":}';
      
      await expect(validationService.validateJSON(jsonString))
        .rejects
        .toThrow();
    });
  });
});