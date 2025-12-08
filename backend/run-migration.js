const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Same config as database.ts
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5433'),
  user: process.env.DB_USER || 'torcida_user',
  password: process.env.DB_PASSWORD || 'torcida_pass_2024',
  database: process.env.DB_NAME || 'torcida_db'
});

async function runMigration() {
  const client = await pool.connect();
  try {
    console.log('🔄 Conectando ao banco de dados...');

    // Read migration file
    const migrationPath = path.join(__dirname, 'migrations', 'add_participant_cpf_name.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📝 Executando migration: add_participant_cpf_name.sql');
    console.log('---');
    console.log(migrationSQL);
    console.log('---');

    // Execute migration
    await client.query(migrationSQL);

    console.log('✅ Migration executada com sucesso!');

    // Verify changes
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'quiz_participants'
      ORDER BY ordinal_position;
    `);

    console.log('\n📊 Estrutura atualizada da tabela quiz_participants:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });

    // Check constraints
    const constraints = await client.query(`
      SELECT constraint_name, constraint_type
      FROM information_schema.table_constraints
      WHERE table_name = 'quiz_participants';
    `);

    console.log('\n🔒 Constraints:');
    constraints.rows.forEach(row => {
      console.log(`  - ${row.constraint_name} (${row.constraint_type})`);
    });

  } catch (error) {
    console.error('❌ Erro ao executar migration:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration()
  .then(() => {
    console.log('\n✅ Processo concluído!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Falha na migration:', error);
    process.exit(1);
  });
