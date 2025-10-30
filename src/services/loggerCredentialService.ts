export class LoggerCredentialService {
  /**
   * Send logger credentials via secure email
   * @param email - The logger's email address
   * @param name - The logger's name
   * @param temporaryPassword - The temporary password to send
   */
  static async sendCredentialsEmail(
    email: string,
    name: string,
    temporaryPassword: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Make an API call to the backend to send credentials email
      const response = await fetch('/api/admin/loggers/send-credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          name,
          temporaryPassword
        }),
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        return {
          success: true,
          message: 'Credentials email sent successfully'
        };
      } else {
        throw new Error(result.error || 'Failed to send credentials email');
      }
    } catch (error) {
      console.error('Failed to send credentials email:', error);
      return {
        success: false,
        message: 'Failed to send credentials email'
      };
    }
  }
}