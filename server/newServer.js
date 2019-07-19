

const  express  = require ( 'express' );
const  bodyParser  = require ( 'body-parser' );

const app = express();



//  analisar o aplicativo / x-www-form-urlencoded
app.use (bodyParser.urlencoded ({extended : false }));
//  analisar o aplicativo / json
app.use (bodyParser.json());


//create a cors middleware
app.use(function(req, res, next) {
  //set headers to allow cross origin request.
      res.header("Access-Control-Allow-Origin", "*");
      res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
      res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
      next();
  });

app.get('/', function (req, res) {
  res.send('Hello World!');
  
});


app.post('/convertFilePDF', function (req, res) {
  console.log(req.body.file);
  res.send().status(200);
});


app.post('/convertFilePS', function (req, res) {
  console.log(req.body.file);
  res.send().status(200);
});




app.listen(3000, function () {
  console.log('Server is lissting on port 3000');
});




