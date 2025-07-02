// import pool from '../config/db.js';

// const createParentsTable = async () => {
//   try {
//     // Check if the parents table exists
//     const checkTableQuery = `
//       SELECT EXISTS (
//         SELECT FROM information_schema.tables 
//         WHERE table_schema = 'public' 
//         AND table_name = 'parents'
//       );
//     `;
    
//     const tableExists = await pool.query(checkTableQuery);
    
//     if (tableExists.rows[0].exists) {
//       console.log('📋 Parents table already exists, checking for required columns...');
      
//       // Check if password column exists
//       const checkPasswordColumn = `
//         SELECT column_name 
//         FROM information_schema.columns 
//         WHERE table_name = 'parents' AND column_name = 'password';
//       `;
      
//       const passwordColumnExists = await pool.query(checkPasswordColumn);
      
//       if (passwordColumnExists.rows.length === 0) {
//         // Add password column
//         await pool.query('ALTER TABLE parents ADD COLUMN password VARCHAR(255);');
//         console.log('✅ Added password column to parents table');
//       }
      
//       // Check if verified column exists
//       const checkVerifiedColumn = `
//         SELECT column_name 
//         FROM information_schema.columns 
//         WHERE table_name = 'parents' AND column_name = 'verified';
//       `;
      
//       const verifiedColumnExists = await pool.query(checkVerifiedColumn);
      
//       if (verifiedColumnExists.rows.length === 0) {
//         // Add verified column
//         await pool.query('ALTER TABLE parents ADD COLUMN verified BOOLEAN DEFAULT FALSE;');
//         console.log('✅ Added verified column to parents table');
//       }
      
//       // Update existing records to have verified = true if they don't have passwords
//       await pool.query(`
//         UPDATE parents 
//         SET verified = TRUE 
//         WHERE password IS NULL OR password = '';
//       `);
      
//       console.log('✅ Parents table updated successfully');
      
//     } else {
//       // Create new table if it doesn't exist
//       const createTableQuery = `
//         CREATE TABLE parents (
//           id VARCHAR(20) PRIMARY KEY,
//           name VARCHAR(100) NOT NULL,
//           email VARCHAR(100) UNIQUE NOT NULL,
//           phone VARCHAR(15) NOT NULL,
//           children INTEGER DEFAULT 1,
//           password VARCHAR(255),
//           token VARCHAR(255),
//           verified BOOLEAN DEFAULT FALSE,
//           created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//           updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
//         );
//       `;
      
//       await pool.query(createTableQuery);
//       console.log('✅ Parents table created successfully');
//     }

//     // Create indexes
//     await pool.query('CREATE INDEX IF NOT EXISTS idx_parents_email ON parents(email);');
//     await pool.query('CREATE INDEX IF NOT EXISTS idx_parents_verified ON parents(verified);');
//     console.log('✅ Parents table indexes ensured');
    
//   } catch (error) {
//     console.error('❌ Error with parents table:', error);
//     console.log('Server will continue running...');
//   }
// };

// export default createParentsTable;
