require('dotenv').config();
const express = require('express');
const app = express();
const Person = require('./models/person');
const morgan = require('morgan');
const cors = require('cors');
const { response } = require('express');

// let persons = [
//   {
//     id: 1,
//     name: 'Arto Hellas',
//     number: '040-123456',
//   },
//   {
//     id: 2,
//     name: 'Ada Lovelace',
//     number: '39-44-5323523',
//   },
//   {
//     id: 3,
//     name: 'Dan Abramov',
//     number: '12-43-234345',
//   },
//   {
//     id: 4,
//     name: 'Mary Poppendieck',
//     number: '39-23-6423122',
//   },
// ];

// MIDDLEWARES
app.use(express.json());
app.use(cors());
app.use(express.static('build'));

// app.use(morgan('tiny'));

morgan.token('reqBody', function (request, response) {
  if (JSON.stringify(request.body) === '{}') {
    return null;
  } else {
    return JSON.stringify(request.body);
  }
});

app.use(
  morgan(function (tokens, request, response) {
    return [
      tokens.method(request, response),
      tokens.url(request, response),
      tokens.status(request, response),
      tokens.res(request, response, 'content-length'),
      '-',
      tokens['response-time'](request, response),
      'ms',
      tokens.reqBody(request, response),
    ].join(' ');
  })
);

// ROOT ROUTE
app.get('/', (request, response) => {
  response.send('<h1>Hello World!</h1>');
});

// INFO ROUTE
app.get('/info', (request, response) => {
  Person.find({}).then((persons) => {
    response
      .status(200)
      .send(
        `<b><p>Phonebook has info for ${
          persons.length
        } people</p> <p>${new Date()}</p></b>`
      );
  });
});

// GET ALL PERSONS ROUTE
app.get('/api/persons', (request, response) => {
  Person.find({}).then((persons) => {
    response.status(200).json(persons);
  });
});

// const generateId = (min, max) => {
//   const randomValue = Math.floor(Math.random() * (max - min + 1) + min);

//   while (persons.map((p) => p.id).includes(randomValue)) {
//     randomValue = Math.floor(Math.random() * (max - min + 1) + min);
//   }

//   return randomValue;
// };

// ADD PERSON ROUTE
app.post('/api/persons', (request, response, next) => {
  const body = request.body;

  if (body.name === undefined || body.number === undefined) {
    return response.status(400).json({
      error: 'missing field',
    });
  }

  Person.find({}).then((persons) => {
    if (
      persons.some(
        (person) => person.name.toLowerCase() === body.name.toLowerCase()
      )
    ) {
      response.status(400).json({
        error: `${body.name} already exists in the phonebook`,
      });
    } else {
      const person = new Person({
        name: body.name,
        number: body.number,
      });

      person
        .save()
        .then((savedPerson) => {
          response.status(201).json(savedPerson);
        })
        .catch((error) => next(error));
    }
  });
});

// GET SINLGE PERSON ROUTE
app.get('/api/persons/:id', (request, response, next) => {
  Person.findById(request.params.id)
    .then((person) => {
      if (person) {
        response.json(person);
      } else {
        response.status(404).end();
      }
    })
    .catch((error) => next(error));
});

// UPDATE SINGLE PERSON ROUTE
app.put('/api/persons/:id', (request, response, next) => {
  const body = request.body;

  const person = {
    name: body.name,
    number: body.number,
  };

  Person.findByIdAndUpdate(request.params.id, person, {
    new: true,
    runValidators: true,
    context: 'query',
  })
    .then((updatedPerson) => {
      if (!updatedPerson) {
        throw new Error();
      }
      response.json(updatedPerson);
    })
    .catch((error) => next(error));
});

// DELETE SINGLE PERSON ROUTE
app.delete('/api/persons/:id', (request, response, next) => {
  Person.findByIdAndRemove(request.params.id)
    .then((result) => {
      console.log(result);
      if (!result) {
        throw new Error();
      }
      response.status(204).end();
    })
    .catch((error) => next(error));
});

// ERROR HANDLER MIDDLEWARE
const errorHandler = (error, request, response, next) => {
  console.error(error.message);

  if (error.name === 'CastError') {
    return response.status(400).send({ error: 'malformatted id' });
  } else if (error.name === 'ValidationError') {
    return response.status(400).json({ error: error.message });
  } else {
    return response.status(404).json({ error: `Information not found` });
  }

  next(error);
};

app.use(errorHandler);

const PORT = process.env.PORT;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
