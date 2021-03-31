// Libray code goes here

const TinyHooks = (function () {
  // hooks dictionary will have all hooks in sequence
  // how it will look is given below - first two are for useState and others are for useEffect
  //     {1: 0, 2: Wed Mar 31 2021 13:04:55 GMT+0530 (India Standard Time), 3: undefined, 4: Array(0), 5: Array(1)}
  // 1: 0
  // 2: Wed Mar 31 2021 13:04:55 GMT+0530 (India Standard Time) {}
  // 3: undefined
  // 4: []
  // 5: [0]
  // __proto__: Object
  const hooks = {};  // Hooks dictionary / store
  // subs array will have all the subsribers - i.e all places where subscribe fn is called
  // it will contain all callback function passed to subscribe fn eg below- 
  //   (2) [ƒ, ƒ]
  // 0: () => {…}
  // 1: () => { console.log("something changed..."); }
  // length: 2
  // __proto__: Array(0)
  const subs = [];   // Array of subscribers

  let _key = undefined;
  var sequence = undefined;   // Point to the sequence generator

  // fn to create sequences of hooks eg. [{id:hook,...}]
  // it will return a function where increment happens for adding new hooks to hooks dictionary
  const sequenceGen = function () {
    let start = 0;
    _key = undefined;

    return () => {
      //   start is a closure
      start = start + 1;
      return start;
    }
  }

  // useEffect - depArray is list of dependencies
  const useEffect = function (callback, depArray) {
    _key = sequence();
    //   checking if it has dependencies or not
    const hasNoDeps = !depArray;
    //   getting the list of dependencies from hooks dictionary
    const deps = hooks[_key]; // type: array | undefined (it will be an array or undefiend only)

    //   check all dependencies are same or not
    const hasChangedDeps = deps ?
      !depArray.every((el, i) => el === deps[i]) : true;

    if (hasNoDeps || hasChangedDeps) {
      // if any depencies are changes or there are no dependencies - execute the callback function
      callback();
      // update/store the hook in the hooks dictionary
      hooks[_key] = depArray;
    }
  }

  // Statemanagement hook
  const useState = function (istate) {
    let _state;
    //   first time sequence will be undefined - after first time it will keep incrementing 1,2,3..so on
    if (sequence == undefined) {
      //   fn will be returned from sequenceGen fn that will be used to create and increase squence in hooks dict.
      sequence = sequenceGen();  // Invoke the sequence generator
    }
    // this sequence function return 1 first time and 2,3,4 on further calls
    _key = sequence();  // Initially it will be 0 -> 1

    //   get the hook at a particular key
    let hook = hooks[_key];  // Get the key from the dictionary/hash

    // first time this hook will be undefined - so there is no hook at that key
    // if hook is not already present add in to dict. of hooks and initiazied the state
    if (hook == undefined) {
      //   first time call - create a key for default value of state i.e 0
      hooks[_key] = istate;
      _state = istate;
    } else {
      //   hook is already availabe in the hook dict. - that means we have to update the prev value
      // grabbing the last value and storing it in _state
      _state = hook;
    }

    // Create the updater function - fn to update the state - it will take a key and new state
    let _updater = (k, newState) => {
      //   store the new state in  _ state
      _state = newState;
      // update the hook
      hooks[k] = newState;

      subs.forEach((sub) => {
        // loop through all subscribers and execute all callback function present in the array
        sub();
      });

      // return the state`    
      return _state;
    }
    //   bind the updater fn with the key - so that we don't need to pass key as an extra argument - it'll be already avaiblabe we just need to pass the new state
    //  eg when calling setCount fn returned for useState we don't pass the key we just pass the next state
    _updater = _updater.bind(null, _key);

    //   returning the state and the updater function from useState hook
    // object.freeze will make the array unable to be modified
    return Object.freeze([
      _state,
      _updater
    ]);
  }

  function subscribe(cb) {
    // pushing the callback fn to subscribers array
    subs.push(cb);
  }

  // fn to render componenets on ui
  function render(comp) {
    // here comp will be the entire fn component code eg.
    // comp ƒ Counter() {
    //   const [count, setCount] = TinyHooks.useState(0);
    //   const [time, setTime] = TinyHooks.useState(new Date());

    //   // This could should run on each function call/render
    //   TinyHooks.useEffect…
    const instance = comp(); // invoking (executing) the function
    // here instance is a object with a render method. eg.
    // Object
    // render: () => { root.innerHTML = view; }
    // __proto__: Object
    instance.render();
    // in the next render the key counter can start from 0 again
    sequence = undefined;
    return instance;
  }

  return {
    useState,
    subscribe,
    render,
    useEffect
  }

})();

const root = document.querySelector("#root");

function Counter() {
  const [count, setCount] = TinyHooks.useState(0);
  const [time, setTime] = TinyHooks.useState(new Date());

  // This could should run on each function call/render
  TinyHooks.useEffect(() => {
    console.log("Always run..");
  });

  // This code should run only on first function call
  // one time only
  TinyHooks.useEffect(() => {
    console.log("Only on first call");
    // first time load remote/ajax calls
  }, [])

  // This could should run only when
  // the dependency value changes -> when count changes
  TinyHooks.useEffect(() => {
    setTimeout(() => {
      console.log("Count has changed: ", count);
    }, 500);
  }, [count])

  increase = () => {
    setCount(count + 1);
  }

  decrease = () => {
    setCount(count - 1);
  }

  changeTime = () => {
    setTime(new Date());
  }

  const view = `
      <div>
          <h1>Counter: Test</h1>
          <h2>${time}</h2>
          <h2 class="counter">${count}</h2>
          <div class="button-group">
            <button onclick="increase()" type="button">+</button>
            <button onclick="decrease()" type="button">-</button>
            <button onclick="changeTime()" type="button">show time</button>
          </div>
      </div>
    `;

  return {
    render: () => {
      root.innerHTML = view;
    }
  }
}

// first render
TinyHooks.render(Counter);

// when state changes our ui should be re rendered
TinyHooks.subscribe(() => {
  // Whenever the state changes we are calling render function again and passing the Counter component
  TinyHooks.render(Counter);
});


TinyHooks.subscribe(() => {
  console.log("something changed...");
})
