import validator from "validator";

function validateEmail(email: string){
    return validator.isEmail(email);
}

module.exports =  validateEmail;