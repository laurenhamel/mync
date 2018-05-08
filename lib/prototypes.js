Array.prototype.intersection = function( array ) {
  
  let result = [];
  
  this.forEach((value) => {
           
    if( array.indexOf(value) > -1 ) result.push(value);
    
  });
  
  return result;
  
};