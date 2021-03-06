function MyPromise(executor) {
  var state = "pending";
  var value = null;
  var deferreds = [];

  var resolve = function(val) {
    if (val && val.then) {
      /* this val is a promise so we must wait for it
      to resolve itself before running the next callback
      in the then chain */
      val.then(function(value) {
        resolve(value);
      });
    } else {
      value = val;
      state = "fulfilled";
      runCallbacks();
    }
  };

  var reject = function(reason) {
    value = reason;
    state = "rejected";
    runCallbacks();
  };

  var runCallbacks = function() {
    var result = value;

    while(deferreds.length > 0) {
      var funct = deferreds.shift();
      if (state === "fulfilled") {
        if (funct.resolvedCallback) {
          result = funct.resolvedCallback(value);
          funct.resolve(result);
        }
      } else if (state === "rejected") {
        if (funct.rejectedCallback) {
          result = funct.rejectedCallback(value);
          funct.reject(result);
        }
      }
    }
  };

  this.then = function(resolvedCallback, rejectedCallback) {
    return new MyPromise(function(resolve, reject) {
      var functs = {
        resolvedCallback: resolvedCallback,
        rejectedCallback: rejectedCallback,
        resolve: resolve,
        reject: reject
      };

      deferreds.push(functs);
    });
  };

  executor(resolve, reject);
}

MyPromise.all = function(arrOfPromises) {
  return new MyPromise(function(resolve, reject) {
    var counter = 0;
    var values = [];

    var onFulfilled = function(value) {
      counter += 1;
      values.push(value);

      /* resolve will only be called if all the
      promises are resolved and hence triggering
      the onFulfilled callback */
      if (counter === arrOfPromises.length) {
        resolve(values);
      }
    };

    var onRejected = function(value) {
      reject(value);
    };

    arrOfPromises.forEach(function(promise) {
      promise.then(onFulfilled, onRejected);
    });
  });
};

//tests
function fiveMachine(){
  return new MyPromise(function(resolve, reject){
    setTimeout(function(){
      resolve(5);
    }, 1000);
  });
}

function addSevenMachine(val){
  return new MyPromise(function(resolve, reject){
    setTimeout(function(){
      resolve(7 + val);
    }, 1000);
  });
}

function logCallback(value){
  console.log('got ' + value);
}

function add37(val){
  return val + 37;
};

function sixMachine(){
  return new MyPromise(function(resolve, reject){
    setTimeout(function(){
      //resolve(5);
      reject("I don't know, you probably spelled initialize wrong");
    }, 1000);
  });
}

function alerter(message){
  console.log(message);
}

//basic test
var fivePromise = fiveMachine();
fivePromise.then(logCallback); //should print 'got 5'
fivePromise.then(logCallback); //should print 'got 5'

//daisy chaining
fiveMachine().then(add37).then(logCallback); //should print 'got 42'

//rejection test
sixMachine().then(logCallback, alerter); //should print 'I don't know, you probably spelled initialize wrong'

//flattening
fiveMachine().then(addSevenMachine).then(logCallback); //should print 'got 12'

var promises = [ fiveMachine(), sixMachine() ];
var promises2 = [ fiveMachine(), addSevenMachine(3) ];

//test for MyPromise.all
//The test below should get 'there are errors in one or more promises'
MyPromise.all(promises).then(function(values) {
  console.log("No error on any promises");
}, function(values) { console.log("There are errors in one or more promises"); });

//The test below should get 'No error on any promises'
MyPromise.all(promises2).then(function(values) {
  console.log("No error on any promises");
}, function(values) { console.log("There are errors in one or more promises"); });
