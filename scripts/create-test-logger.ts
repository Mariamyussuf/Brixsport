import bcrypt from 'bcrypt';
import { supabase } from '../src/lib/supabaseClient';

async function createTestLogger() {
  try {
    // Hash the password
    const password = 'test1234';
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Create a test logger
    const { data, error } = await supabase
      .from('Logger')
      .insert([
        {
          name: 'Test Logger',
          email: 'test.logger@example.com',
          password: hashedPassword,
          role: 'logger',
          status: 'active',
          assignedCompetitions: [],
          permissions: ['log_matches', 'log_events', 'view_players', 'view_teams', 'view_competitions'],
          createdAt: new Date().toISOString(),
          lastActive: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ])
      .select();
    
    if (error) {
      console.error('Error creating test logger:', error);
      return;
    }
    
    console.log('Test logger created successfully:', data);
    console.log('Email: test.logger@example.com');
    console.log('Password: test1234');
  } catch (error) {
    console.error('Error:', error);
  }
}

createTestLogger();