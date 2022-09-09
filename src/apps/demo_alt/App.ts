import RetroApp from "retro/App"

class App extends RetroApp {
	constructor(params) {
		super({ ...params });
		this.start();
	}
}

export default App;
