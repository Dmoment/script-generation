import React from 'react';

const App = () => {
  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card">
            <div className="card-header">
              <h1 className="card-title mb-0">Script Generation App</h1>
            </div>
            <div className="card-body">
              <p className="lead">Welcome to your Rails 8 + React.js application!</p>
              <p>This is a React component running inside a Rails 8 application.</p>
              <div className="alert alert-success" role="alert">
                <i className="bi bi-check-circle-fill"></i> React is successfully integrated with Rails 8!
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;