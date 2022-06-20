const { MongoClient, ObjectId } = require('mongodb');
const express = require('express');
const multer = require('multer');
const upload = multer();
const sanitizeHTML = require('sanitize-html');
const fse = require('fs-extra');
const sharp = require('sharp');
const path = require('path');
const React = require('React');
const ReactDOMServer = require('react-dom/server');
const AnimalCard = require('./src/components/AnimalCard').default;
let db;

// When the app first launches, make sure the public/uploaded-photos folder exist
fse.ensureDirSync(path.join(__dirname, 'public', 'uploaded-photos'));

const app = express();
app.set('view engine', 'ejs');
app.set('views', './views');
app.use(express.static('public'));
app.use(express.json()); // for parsing application/json
app.use(express.urlencoded({ extended: false })); // for parsing application/x-www-form-urlencoded

function passwordProtected(req, res, next) {
  res.set('WWW-Authenticate', 'Basic realm="Our MERN App"');
  if (req.headers.authorization == 'Basic YWRtaW46YWRtaW4=') next();
  else res.status(401).send('Try again');
}

// Home page
app.get('/', async (req, res) => {
  const allAnimals = await db.collection('animals').find().toArray();
  const generatedHTML = ReactDOMServer.renderToString(
    <div className="container mt-3">
      <div className="row row-cols-1  row-cols-md-2 row-cols-xl-3">
        {!allAnimals.length && (
          <h3 className="text-danger">There is not any animal</h3>
        )}
        {allAnimals.map(animal => (
          <div className="mb-3">
            <AnimalCard
              readOnly={true}
              id={animal._id}
              name={animal.name}
              species={animal.species}
              photo={animal.photo}
              key={animal._id}
            />
          </div>
        ))}
      </div>
      <p className="mt-5">
        <a href="/admin">Login / manage the animal listing.</a>
      </p>
    </div>
  );
  res.render('home', { generatedHTML });
});

app.use(passwordProtected);

app.get('/admin', passwordProtected, (req, res) => {
  res.render('admin');
});

app.get('/api/animals', passwordProtected, async (req, res) => {
  const allAnimals = await db.collection('animals').find().toArray();

  res.json(allAnimals);
});

// create animal
app.post(
  '/create-animal',
  upload.single('photo'),
  cleanUp,
  async (req, res) => {
    if (req.file) {
      const photoFileName = `${Date.now()}.jpg`;
      await sharp(req.file.buffer)
        .resize(844, 456)
        .jpeg({ quality: 60 })
        .toFile(
          path.join(__dirname, 'public', 'uploaded-photos', photoFileName)
        );
      req.cleanData.photo = photoFileName;
    }

    // console.log(req.body);
    const info = await db.collection('animals').insertOne(req.cleanData);
    const newAnimal = await db
      .collection('animals')
      .findOne({ _id: new ObjectId(info.insertedId) });
    res.send(newAnimal);
  }
);

// delete animal
app.delete('/animal/:id', async (req, res) => {
  if (typeof req.params.id != 'string') req.params.id = '';
  const doc = await db
    .collection('animals')
    .findOne({ _id: new ObjectId(req.params.id) });
  if (doc.photo) {
    await fse.remove(
      path.join(__dirname, 'public', 'uploaded-photos', doc.photo)
    );
  }
  await db
    .collection('animals')
    .deleteOne({ _id: new ObjectId(req.params.id) });
  res.send('good job');
});

// edit animal
app.post(
  '/update-animal',
  upload.single('photo'),
  cleanUp,
  async (req, res) => {
    if (req.file) {
      //if they are uploading a new photo
      const photoFileName = `${Date.now()}.jpg`;
      await sharp(req.file.buffer)
        .resize(844, 456)
        .jpeg({ quality: 60 })
        .toFile(
          path.join(__dirname, 'public', 'uploaded-photos', photoFileName)
        );
      req.cleanData.photo = photoFileName;
      const info = await db
        .collection('animals')
        .findOneAndUpdate(
          { _id: new ObjectId(req.body._id) },
          { $set: req.cleanData }
        );
      if (info.value.photo) {
        fse.remove(
          path.join(__dirname, 'public', 'uploaded-photos', info.value.photo)
        );
      }
      res.send(photoFileName);
    } else {
      //if they are not uploading a new photo
      db.collection('animals').updateOne(
        { _id: new ObjectId(req.body._id) },
        { $set: req.cleanData }
      );
      res.send(false);
    }
  }
);

// avoid inserting object to database
function cleanUp(req, res, next) {
  if (typeof req.body.name != 'string') req.body.name = '';
  if (typeof req.body.species != 'string') req.body.species = '';
  if (typeof req.body._id != 'string') req.body._id = '';

  req.cleanData = {
    name: sanitizeHTML(req.body.name.trim(), {
      allowedTags: [],
      allowedAttributes: {}
    }),
    species: sanitizeHTML(req.body.species.trim(), {
      allowedTags: [],
      allowedAttributes: {}
    })
  };

  next();
}

// connect to mongodb
async function start() {
  const client = new MongoClient(
    'mongodb://localhost:27017/firstMernApp?&authSource=admin'
  );
  await client.connect();
  db = client.db();

  app.listen(3000);
}

start();
// mongodb://localhost:27017
