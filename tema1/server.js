const http = require('http');
const mysql = require('mysql2');


const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'password',
  database: 'students',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const server = http.createServer((req, res) => {
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'GET' && req.url === '/students') {
    getStudents(req, res);
  }
  else if (req.method === 'GET' && req.url.startsWith('/students/') && req.url.endsWith('/subjects')) {
    getStudentSubjectsById(req, res);
  }
  else if (req.method === 'GET' && req.url.startsWith('/students/') && req.url.endsWith('/grades')) {
    getStudentGradesById(req, res);
  }
  else if (req.method === 'GET' && req.url.startsWith('/students/')) {
    getStudentById(req, res);
  }
  else if (req.method === 'POST' && req.url === '/students') {
    addStudent(req, res);
  }
  else if (req.method === 'POST' && req.url.startsWith('/students') && req.url.endsWith('/subjects')) {
    addStudentSubjectById(req, res);
  }
  else if (req.method === 'POST' && req.url.startsWith('/students') && req.url.endsWith('/grades')) {
    addStudentGradeById(req, res);
  }
  else if (req.method === 'PUT' && req.url.startsWith('/students') && req.url.includes('/grades')) {
    updateStudentGrades(req, res);
  }
  else if (req.method === 'PUT' && req.url.startsWith('/students')) {
    updateStudent(req, res);
  }
  else if (req.method === 'DELETE' && req.url.startsWith('/students') && req.url.includes('/grades')) {
    deleteStudentGrades(req, res);
  }
  else if (req.method === 'DELETE' && req.url.startsWith('/students')) {
    deleteStudent(req, res);
  }
  else {

    res.statusCode = 404;
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

function getStudents(req, res) {

  pool.getConnection((err, connection) => {
    if (err) {
      res.statusCode = 500;
      res.end(JSON.stringify({ error: 'Internal server error' }));
      return;
    }

    connection.query('SELECT id, name, year FROM students', (err, results) => {
      connection.release(); // Release the connection back to the pool
      if (err) {
        res.statusCode = 500;
        res.end(JSON.stringify({ error: 'Database error' }));
        return;
      }

      res.statusCode = 200;
      res.end(JSON.stringify(results));
    });
  });
}

function getStudentById(req, res) {

  const args = req.url.split('/');
  const studentId = args[2];

  if (checkArgs(req, res, args.length, 4, studentId)) {
    return;
  }

  pool.getConnection((err, connection) => {
    if (err) {
      console.error('Error connecting to database:', err);
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Error connecting to database');
      return;
    }

    const selectStudentQuery = 'SELECT name,year FROM students WHERE id = ?';
    connection.query(selectStudentQuery, [studentId], (err, results) => {
      connection.release();
      if (err) {
        console.error('Error fetching student:', err);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Error fetching student');
        return;
      }

      if (results.length === 0) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Student not found');
        return;
      }

      const student = results;
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(student));
    });
  });
}

function getStudentSubjectsById(req, res) {
  const args = req.url.split('/');
  const studentId = args[2];

  if (checkArgs(req, res, args.length, 4, studentId)) {
    return;
  }

  pool.getConnection((err, connection) => {
    if (err) {
      console.error('Error connecting to database:', err);
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Error connecting to database');
      return;
    }

    const selectStudentQuery = "SELECT subjects.id, subjects.name FROM student_subjects \
    JOIN subjects ON student_subjects.subject_id = subjects.id \
    WHERE student_subjects.student_id = ?";
    connection.query(selectStudentQuery, [studentId], (err, results) => {
      connection.release();
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Error fetching subjects');
        return;
      }

      if (results.length === 0) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Subjects not found');
        return;
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(results));
    });
  });
}

function getStudentGradesById(req, res) {
  const args = req.url.split('/');
  const studentId = args[2];

  if (checkArgs(req, res, args.length, 4, studentId)) {
    return;
  }
  pool.getConnection((err, connection) => {
    if (err) {
      console.error('Error connecting to database:', err);
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Error connecting to database');
      return;
    }

    const selectStudentQuery = "SELECT grades.id, subjects.name, grades.grade \
    FROM grades \
    JOIN subjects ON grades.subject_id = subjects.id \
    WHERE grades.student_id = ?";
    connection.query(selectStudentQuery, [studentId], (err, results) => {
      connection.release();
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Error fetching grades');
        return;
      }

      if (results.length === 0) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Grades not found');
        return;
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(results));
    });
  });
}

function addStudent(req, res) {
  let body = '';

  req.on('data', chunk => {
    body += chunk.toString();
  });

  req.on('end', () => {
    var json = checkJSON(req, res, body);
    if (json === -1) {
      return;
    }
    if (!json.name) {
      res.writeHead(400, { 'Content-Type': 'text/plain' });
      res.end('Missing required field: name');
      return;
    }
    if (!json.year) {
      res.writeHead(400, { 'Content-Type': 'text/plain' });
      res.end('Missing required field: year');
      return -1;
    }
    const { name, year } = json;

    // Insert the new student into the database
    pool.getConnection((err, connection) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Error connecting to database');
        return;
      }

      const insertStudentQuery = 'INSERT INTO students (name,year) VALUES (?,?)';
      connection.query(insertStudentQuery, [name, year], (err, result) => {
        connection.release(); // Release the connection after the query
        if (err) {
          res.writeHead(500, { 'Content-Type': 'text/plain' });
          res.end('Error inserting student');
          return;
        }
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('New student inserted');
      });
    });
  });
}



function addStudentSubjectById(req, res) {
  const args = req.url.split('/');
  const studentId = args[2];

  if (checkArgs(req, res, args.length, 4, studentId)) {
    return;
  }
  let body = '';

  req.on('data', chunk => {
    body += chunk.toString();
  });

  req.on('end', () => {
    var json = checkJSON(req, res, body);
    if (json === -1) {
      return;
    }
    if (!json.name) {
      res.writeHead(400, { 'Content-Type': 'text/plain' });
      res.end('Missing required field: name');
      return;
    }
    const { name } = JSON.parse(body);

    pool.getConnection((err, connection) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Error connecting to database');
        return;
      }
      // check if the student exists
      const checkStudentQuery = 'SELECT COUNT(*) as n \
       FROM students \
       WHERE id = ?';
      connection.query(checkStudentQuery, [studentId], (err, exists) => {
        if (err) {
          connection.release();
          res.writeHead(500, { 'Content-Type': 'text/plain' });
          res.end('Error checking student');
          return;
        }
        if (exists[0]['n'] === 0) {
          connection.release();
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('Student not found');
          return;
        }

        const checkSubjectQuery = 'SELECT id FROM subjects WHERE name = ?';
        connection.query(checkSubjectQuery, [name], (err, results) => {
          if (err) {
            connection.release();
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Error checking subject');
            return;
          }

          if (results.length === 0) {
            connection.release();
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Subject not found');
            return;
          }

          const insertStudentQuery = 'INSERT INTO student_subjects (student_id, subject_id) \
      SELECT s.id, sub.id \
      FROM students s, subjects sub \
      WHERE s.id = ? \
      AND sub.name = ? ';
          connection.query(insertStudentQuery, [studentId, name], (err, result) => {
            connection.release();
            if (err) {
              res.writeHead(500, { 'Content-Type': 'text/plain' });
              res.end('Error inserting subject');
              return;
            }
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end('New Subject inserted');
          });
        });
      });
    });
  });
}


function addStudentGradeById(req, res) {
  const args = req.url.split('/');
  const studentId = args[2];

  if (checkArgs(req, res, args.length, 4, studentId)) {
    return;
  }
  let body = '';

  req.on('data', chunk => {
    body += chunk.toString();
  });

  req.on('end', () => {
    var json = checkJSON(req, res, body);
    if (json === -1) {
      return;
    }
    if (!json.name) {
      res.writeHead(400, { 'Content-Type': 'text/plain' });
      res.end('Missing required field: name');
      return;
    }
    if (!json.grade) {
      res.writeHead(400, { 'Content-Type': 'text/plain' });
      res.end('Missing required field: grade');
      return -1;
    }
    const { name, grade } = JSON.parse(body);

    if (grade < 1 || grade > 10) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Invalid grade');
      return;
    }

    pool.getConnection((err, connection) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Error connecting to database');
        return;
      }

      // check if the student exists
      const checkStudentQuery = 'SELECT COUNT(*) as n \
      FROM students \
      WHERE id = ?';
      connection.query(checkStudentQuery, [studentId], (err, exists) => {
        if (err) {
          connection.release();
          res.writeHead(500, { 'Content-Type': 'text/plain' });
          res.end('Error checking student');
          return;
        }
        if (exists[0]['n'] === 0) {
          connection.release();
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('Student not found');
          return;
        }
        const checkSubjectQuery = 'SELECT COUNT(*) as n \
        FROM students s \
        JOIN student_subjects ss ON s.id = ss.student_id \
        JOIN subjects sub ON ss.subject_id = sub.id \
        WHERE s.id = ? \
        AND sub.name = ?';
        connection.query(checkSubjectQuery, [studentId, name], (err, exists) => {
          if (err) {
            connection.release();
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Error checking subject');
            return;
          }
          if (exists[0]['n'] === 0) {
            connection.release();
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Subject not found');
            return;
          }

          const insertStudentQuery = 'INSERT INTO grades (student_id, subject_id, grade) \
      SELECT s.id, sub.id, ? \
      FROM students s, subjects sub \
      WHERE s.id = ? \
      AND sub.name = ? ';
          connection.query(insertStudentQuery, [grade, studentId, name], (err, result) => {
            connection.release();
            if (err) {
              res.writeHead(500, { 'Content-Type': 'text/plain' });
              res.end('Error inserting grade');
              return;
            }
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end('New Grade inserted');
          });
        });
      });
    });
  });
}

function updateStudent(req, res) {
  const args = req.url.split('/');
  const studentId = args[2];

  if (checkArgs(req, res, args.length, 3, studentId)) {
    return;
  }
  let body = '';

  req.on('data', chunk => {
    body += chunk.toString();
  });

  req.on('end', () => {
    var json = checkJSON(req, res, body);
    if (json === -1) {
      return;
    }
    if (!json.name) {
      res.writeHead(400, { 'Content-Type': 'text/plain' });
      res.end('Missing required field: name');
      return;
    }
    if (!json.year) {
      res.writeHead(400, { 'Content-Type': 'text/plain' });
      res.end('Missing required field: year');
      return -1;
    }
    const { name, year } = JSON.parse(body);

    if (year < 1 || year > 3) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Invalid year');
      return;
    }

    pool.getConnection((err, connection) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Error connecting to database');
        return;
      }

      // check if the student exists
      const checkStudentQuery = 'SELECT COUNT(*) as n \
      FROM students \
      WHERE id = ?';
      connection.query(checkStudentQuery, [studentId], (err, exists) => {
        if (err) {
          connection.release();
          res.writeHead(500, { 'Content-Type': 'text/plain' });
          res.end('Error checking student');
          return;
        }
        if (exists[0]['n'] === 0) {
          connection.release();
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('Student not found');
          return;
        }

        const insertStudentQuery = 'UPDATE students \
        SET name = ?, year=? \
        WHERE id = ?';
        connection.query(insertStudentQuery, [name, year, studentId], (err, result) => {
          connection.release();
          if (err) {
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Error updating student');
            return;
          }
          res.writeHead(200, { 'Content-Type': 'text/plain' });
          res.end('Student updated');
        });
      });
    });
  });
}


function updateStudentGrades(req, res) {
  const args = req.url.split('/');
  const studentId = args[2];
  const gradeId = args[4];
  console.log(args);

  if (checkArgs(req, res, args.length, 5, studentId)) {
    return;
  }
  let body = '';

  req.on('data', chunk => {
    body += chunk.toString();
  });

  req.on('end', () => {
    var json = checkJSON(req, res, body);
    if (json === -1) {
      return;
    }
    if (!json.name) {
      res.writeHead(400, { 'Content-Type': 'text/plain' });
      res.end('Missing required field: name');
      return;
    }
    if (!json.grade) {
      res.writeHead(400, { 'Content-Type': 'text/plain' });
      res.end('Missing required field: grade');
      return -1;
    }
    const { name, grade } = JSON.parse(body);

    if (grade < 1 || grade > 10) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Invalid grade');
      return;
    }

    pool.getConnection((err, connection) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Error connecting to database');
        return;
      }
      const checkStudentQuery = 'SELECT COUNT(*) as n \
      FROM students \
      WHERE id = ?';
      connection.query(checkStudentQuery, [studentId], (err, exists) => {
        if (err) {
          connection.release();
          res.writeHead(500, { 'Content-Type': 'text/plain' });
          res.end('Error checking student');
          return;
        }
        if (exists[0]['n'] === 0) {
          connection.release();
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('Student not found');
          return;
        }

        const checkSubjectQuery = 'SELECT id FROM subjects WHERE name = ?';
        connection.query(checkSubjectQuery, [name], (err, results) => {
          if (err) {
            connection.release();
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Error checking subject');
            return;
          }

          if (results.length === 0) {
            connection.release();
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Subject not found');
            return;
          }
          const subjectId = results[0]['id'];
          const checkGradeQuery = 'SELECT COUNT(*) as n \
      FROM grades \
      WHERE id = ?';
          connection.query(checkGradeQuery, [gradeId], (err, exists) => {
            if (err) {
              connection.release();
              res.writeHead(500, { 'Content-Type': 'text/plain' });
              res.end('Error checking grade');
              return;
            }
            if (exists[0]['n'] === 0) {
              connection.release();
              res.writeHead(404, { 'Content-Type': 'text/plain' });
              res.end('Grade not found');
              return;
            }


            const updateGradeQuery = 'UPDATE grades \
            SET subject_id=?, grade = ? \
            WHERE id = ?';
            connection.query(updateGradeQuery, [subjectId, grade, gradeId], (err, result) => {
              connection.release();
              if (err) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Error updating grade');
                console.log(err);
                return;
              }
              res.writeHead(200, { 'Content-Type': 'text/plain' });
              res.end('Grade updated');
            });
          });
        });
      });
    });
  });
}



function deleteStudentGrades(req, res) {
  const args = req.url.split('/');
  const studentId = args[2];
  const gradeId = args[4];

  if (args.length > 5) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
    return;
  }

  pool.getConnection((err, connection) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Error connecting to database');
      return;
    }

    // check if the student exist
    const checkStudentQuery = 'SELECT COUNT(*) as n \
      FROM students \
      WHERE id = ?';
    connection.query(checkStudentQuery, [studentId], (err, exists) => {
      if (err) {
        connection.release();
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Error checking student');
        return;
      }
      if (exists[0]['n'] === 0) {
        connection.release();
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Student not found');
        return;
      }

      // check if the grade exists
      const checkGradeQuery = 'SELECT COUNT(*) as n \
          FROM grades \
          WHERE id = ?';
      connection.query(checkGradeQuery, [gradeId], (err, exists) => {
        if (err) {
          connection.release();
          res.writeHead(500, { 'Content-Type': 'text/plain' });
          res.end('Error checking grade');
          return;
        }
        if (exists[0]['n'] === 0) {
          connection.release();
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('Grade not found');
          return;
        }

        // delete the grade with the given id
        const deleteGradeQuery = 'DELETE FROM grades \
            WHERE id = ?';
        connection.query(deleteGradeQuery, [gradeId], (err, result) => {
          connection.release();
          if (err) {
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Error deleting grade');
            console.log(err);
            return;
          }
          res.writeHead(200, { 'Content-Type': 'text/plain' });
          res.end('Grade deleted');
        });
      });
    });
  });
}

function deleteStudent(req, res) {
  const args = req.url.split('/');
  const studentId = args[2];

  if (checkArgs(req, res, args.length, 4, studentId)) {
    return;
  }

  pool.getConnection((err, connection) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Error connecting to database');
      return;
    }

    // check if the student exists
    const checkStudentQuery = 'SELECT COUNT(*) as n \
      FROM students \
      WHERE id = ?';
    connection.query(checkStudentQuery, [studentId], (err, exists) => {
      if (err) {
        connection.release();
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Error checking student');
        return;
      }
      if (exists[0]['n'] === 0) {
        connection.release();
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Student not found');
        return;
      }

      // delete the student's grades
      const deleteGradesQuery = 'DELETE FROM grades \
            WHERE student_id = ?';
      connection.query(deleteGradesQuery, [studentId], (err, result) => {
        connection.release();
        if (err) {
          res.writeHead(500, { 'Content-Type': 'text/plain' });
          res.end('Error student grades');
          console.log(err);
          return;
        }

        //delete the relations between subjects and the student
        const deleteSubjectsQuery = 'DELETE FROM student_subjects \
        WHERE student_id = ?';
        connection.query(deleteSubjectsQuery, [studentId], (err, result) => {
          connection.release();
          if (err) {
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Error student grades');
            console.log(err);
            return;
          }

          // delete the student
          const deleteStudentQuery = 'DELETE FROM students \
            WHERE id = ?';
          connection.query(deleteStudentQuery, [studentId], (err, result) => {
            connection.release();
            if (err) {
              res.writeHead(500, { 'Content-Type': 'text/plain' });
              res.end('Error deleting student');
              console.log(err);
              return;
            }
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end('Student deleted');
          });
        });
      });
    });
  });
}

function checkArgs(req, res, len, maxLen, studentId) {
  if (len > maxLen) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
    return -1;
  }

  if (isNaN(studentId)) {
    res.writeHead(400, { 'Content-Type': 'text/plain' });
    res.end('Invalid student ID');
    return -1;
  }
}

function checkJSON(req, res, body) {
  try {
    data = JSON.parse(body);
    return data;
  } catch (error) {
    // Handle JSON parsing error
    res.writeHead(400, { 'Content-Type': 'text/plain' });
    res.end('Invalid JSON format');
    return -1;
  }

}


const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
