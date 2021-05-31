import { Switch, Route, Link } from 'react-router-dom';

import Fib from './Fib';
import OtherPage from './OtherPage';

function App() {
  return (
    <div className="App">
      <header>
        <Link to="/">Home</Link>
        <Link to="/otherpage">OtherPage</Link>
      </header>
      <Switch>
        <Route exact path="/">
          <Fib />
        </Route>
        <Route path="/otherpage">
          <OtherPage />
        </Route>
      </Switch>
    </div>
  );
}

export default App;
