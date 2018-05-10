// Load dependencies.
const Deferred = require('deferred-js');

// Create chain.
class Chain {
  
  constructor() {
    this.links = [];
    this.befores = [];
    this.afters = [];
    this.starts = [];
    this.ends = [];
    this.promises = [];
  }
  
  link( index, callback ) {
    
    const self = this;
    
    if( typeof callback !== 'function' ) return self;
    
    if( !self.links[index] ) self.links[index] = [];
    
    self.links[index].push(() => {
      
      const deferred = new Deferred();
      
      callback(deferred.resolve, deferred.reject);
      
      return deferred.promise();
      
    });
    
    return self;
    
  }
  
  before( index, callback ) {
    
    if( typeof callback !== 'function' ) return this;
    
    if( !this.befores[index] ) this.befores[index] = [];
    
    this.befores[index].push(callback);
    
    return this;
    
  }
  
  after( index, callback ) {
    
    if( typeof callback !== 'function' ) return this;
    
    if( !this.afters[index] ) this.afters[index] = [];
    
    this.afters[index].push(callback);
    
    return this;
    
  }
  
  start( callback ) {
    
    if( typeof callback !== 'function' ) return this;
    
    this.starts.push(callback);
    
    return this;
    
  }
  
  end( callback ) {
    
    if( typeof callback !== 'function' ) return this;
    
    this.ends.push(callback);
    
    return this;
    
  }
  
  reaction() {
    
    const self = this;
    
    self.starts.forEach((start) => start());
    
    self.links.forEach((link, index) => {
      
      if( self.befores[index] && self.befores[index].length > 0 ) self.befores[index].forEach((before) => before());
      
      link.forEach((promise) => {
      
        self.promises.push(promise().always(() => {

          if( self.afters[index] && self.afters[index].length > 0 ) self.afters[index].forEach((after) => after());

        }));
        
      });
      
    });
    
    Deferred.when(self.promises).done(() => {
      
      self.ends.forEach((end) => end());
      
      self.reset();
      
    });
    
    return this;
    
  }
  
  reset() {
    
    this.steps = [];
    this.befores = [];
    this.afters = [];
    this.end = [];
    this.promises = [];
    
    return this;
    
  }
  
}

// Export.
module.exports = {Chain};