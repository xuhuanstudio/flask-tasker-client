Flask-Tasker-Client
==============

Client for the [flask-tasker](https://pypi.python.org/pypi/Flask-Tasker) framework.

Installation
------------

You can install this package as usual with npm:

    npm install flask-tasker-client

Example
-------

```javascript
// javascript

import {Tasker} from 'flask-tasker-client';

const baseUrl = 'http://localhost:3000';
const tasker = new Tasker({baseUrl});

const dispose = tasker.dispose({
  data: {count: 10},
  onProgress: res => console.log('on progress', res),
  onSuccess: res => console.log('on success', res),
  onError: res => console.error('on error', res),
  onTerminate: res => console.log('on terminate', res)
});
dispose.promise
  .then(res => console.log('on success (promise)', res))
  .catch(err => console.error('on error (promise)', err));

// Simulate task termination.
setTimeout(() => {
  dispose.terminate()
    .then(res => console.log('terminate', res))
    .catch(err => console.error('terminate', err));
}, 1000 * Math.random() * 10);
```

Resources
---------

- Flask-Tasker-Client
  - [GitHub](https://github.com/xuhuanstudio/flask-tasker-client)
  - [NPM](https://www.npmjs.com/package/flask-tasker-client)
- Flask-Tasker
  - [GitHub](https://github.com/xuhuanstudio/flask-tasker)
  - [PyPI](https://pypi.python.org/pypi/Flask-Tasker)
