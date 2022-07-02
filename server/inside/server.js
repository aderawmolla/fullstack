
const express = require('express')
const bcrypt=require('bcryptjs')
const app = express()
const port = 4000
const jwt=require('jsonwebtoken')
app.use(express.json())

app.get('/', (req, res) => {
  res.send('Hello World!')
})
const fetch = require("node-fetch")

const HASURA_OPERATION = `
mutation signup($email:String,$name:String,$password:String,$phonenumber:String) {
  insert_user_one(object: {email:$email,name:$name,password:$password,phonenumber:$phonenumber}) {
    id
  }
}
`;

// execute the parent operation in Hasura
const execute = async (variables) => {
  const fetchResponse = await fetch(
    "http://localhost:8080/v1/graphql",
    {
      method: 'POST',
      body: JSON.stringify({
        query: HASURA_OPERATION,
        variables
      })
    }
  );
  const data = await fetchResponse.json();
  console.log('DEBUG: ', data);
  return data;
};
  
// app.use(bodyParser.urlencoded({ extended: false }));
// Request Handler
app.post('/signup', async (req, res) => {
  
  // get request input
  const { email, name, password, phonenumber } = req.body.input;
  var hashed=await bcrypt.hash(password,10)
  // run some business logic
   const token= await jwt.sign({
    email
   },'7tetfgkjghnvlxzngsjkdkllslslwee',{expiresIn:360000
   })
  // execute the Hasura operation
  const { data, errors } = await execute({ email, name, password:hashed, phonenumber });

  // if Hasura operation errors, then throw error
  if (errors) {
    return res.status(400).json(errors[0])
  }

  // success
  return res.json({
    ...data.insert_user_one,
    token:token,
    message:'you signup  seccessfully'
  })

});


  
// execute the parent operation in Hasura
app.post('/login', async (req, res) => {
  // get request input
  const HASURA_l_OPERATION = `
query login($email: String, $password: String) {
  user(where: {email: {_eq: $email}, password: {_eq: $password}}) {
    password
  
  }
}
`;

  const execute = async (variables) => {
    const fetchResponse = await fetch(
      "http://localhost:8080/v1/graphql",
      {
        method: 'POST',
        body: JSON.stringify({
          query: HASURA_l_OPERATION,
          variables
        })
      }
    );
    const data = await fetchResponse.json();
    console.log('DEBUG: ', data);
    return data;
  };
  const { email, password } = req.body.input;
  var hashed=await bcrypt.hash(password,10)
  const { data, errors } = await execute({ email,password});
  if(errors){
    return res.status(500).json({messge: errors.message});
}
// user is not found in database i.e. user is not registered yet.
else if (!data){
    return res.status(401).json({ message:'The email address ' + req.body.email + ' is not associated with any account. please check and try again!'});
}
//comapre user's password if user is find in above step
// else if()){
//     return res.status(401).json({messag:'Wrong Password!'});
// }

// else if (!user.isVerified){
//     return res.status(401).json({msg:'Your Email has not been verified. Please click on resend'});
// } 
else{
    return res.status(200).json({
      message:'User successfully logged in.'});
}
});

// Request Handler


 
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})