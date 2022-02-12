const express = require('express');
const app = express();
const morgan = require('morgan');
const cors = require('cors');

let persons = [
  {
    id: 1,
    name: 'Arto Hellas',
    number: '040-123456',
  },
  {
    id: 2,
    name: 'Ada Lovelace',
    number: '39-44-5323523',
  },
  {
    id: 3,
    name: 'Dan Abramov',
    number: '12-43-234345',
  },
  {
    id: 4,
    name: 'Mary Poppendieck',
    number: '39-23-6423122',
  },
];

app.use(express.json());
app.use(cors());

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

app.get('/', (request, response) => {
  response.send('<h1>Hello World!</h1>');
});

app.get('/info', (request, response) => {
  response
    .status(200)
    .send(
      `<b><p>Phonebook has info for ${
        persons.length
      } people</p> <p>${new Date()}</p></b>`
    );
});

app.get('/api/persons', (request, response) => {
  response.status(200).json(persons);
});

const generateId = (min, max) => {
  const randomValue = Math.floor(Math.random() * (max - min + 1) + min);

  while (persons.map((p) => p.id).includes(randomValue)) {
    randomValue = Math.floor(Math.random() * (max - min + 1) + min);
  }

  return randomValue;
};

app.post('/api/persons', (request, response) => {
  const id = generateId(1, 100000);

  const body = request.body;

  if (!body.name || !body.number) {
    return response.status(400).json({
      error: 'missing field',
    });
  } else if (persons.find((person) => person.name === body.name)) {
    return response.status(400).json({
      error: 'name must be unique',
    });
  }

  const person = {
    id: id,
    name: body.name,
    number: body.number,
  };

  persons = persons.concat(person);
  response.status(201).json(person);
});

app.get('/api/persons/:id', (request, response) => {
  const id = Number(request.params.id);

  const person = persons.find((person) => person.id === id);

  if (person) {
    response.status(200).json(person);
  } else {
    response.status(404).end();
  }
});

app.delete('/api/persons/:id', (request, response) => {
  const id = Number(request.params.id);

  persons = persons.filter((person) => person.id !== id);

  response.status(204).end();
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
