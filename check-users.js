const { User } = require('./backend/models');

async function checkUsers() {
  try {
    console.log('Conectando a la base de datos...');
    const users = await User.findAll({
      attributes: ['id', 'username', 'email', 'role', 'active'],
      raw: true
    });
    
    console.log('Usuarios encontrados:', users.length);
    console.log(users);
    
    if (users.length > 0) {
      console.log('\nPrimer usuario:');
      console.log(`ID: ${users[0].id}`);
      console.log(`Usuario: ${users[0].username}`);
      console.log(`Email: ${users[0].email}`);
      console.log(`Rol: ${users[0].role}`);
      console.log(`Activo: ${users[0].active}`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error al consultar usuarios:', error);
    process.exit(1);
  }
}

checkUsers();
