const bcrypt = require('bcryptjs');

// סיסמה רגילה שאתה בודק
const plain = '123456';

// הסיסמה שהועתקה מה-DB
const hashed = '$2a$10$Q8uMjsKv9KdQ6m7cMCUZkOKW0eIkumWaIkL9qb6TTm1rcwF1BbcCy';

const match = bcrypt.compareSync(plain, hashed);
console.log('Password match:', match);
