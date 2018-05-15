Array.prototype.intersection = function( array ) {
  
  let result = [];
  
  this.forEach((value) => {
           
    if( array.indexOf(value) > -1 ) result.push(value);
    
  });
  
  return result;
  
};

String.prototype.toCapitalize = function() {
  
  return this.substr(0, 1).toUpperCase() + this.substr(1);
  
};

String.prototype.toTitleCase = function() {
  
  return this.split(' ').map((word) => word.toCapitalize()).join(' ');
  
};