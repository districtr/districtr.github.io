import { bindAll } from "../utils";

export default class UIStateStore {
    constructor(reducer, initialState) {
        this.reducer = reducer;
        this.state = initialState;
        this.subscribers = [];

        bindAll(["dispatch", "subscribe"], this);
    }
    dispatch(action) {
        if (this.DEBUG) {
            console.log(action);
        }
        const nextState = this.reducer(this.state, action);
        if (nextState !== this.state) {
            this.state = nextState;
            this.subscribers.forEach(subscriber =>
                subscriber(this.state, this.dispatch)
            );
        }
    }
    subscribe(subscriber) {
        this.subscribers.push(subscriber);
    }
}
