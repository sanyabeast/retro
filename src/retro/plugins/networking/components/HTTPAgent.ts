/** created by @sanyabeast / 28 dec 2021 */

import axios, { AxiosResponse } from "axios";
import Component from "retro/Component";

class HTTPAgent extends Component {
    base_uri: string = window.location.origin
    general_opts: { [x: string]: any } = {}
    public override on_create(): void {
        this.log("created");
    }
    public override on_tick(time_data: IRetroObjectTimeData): void { }
    public get(uri: string = "", opts: { [x: string]: any } = {}): Promise<AxiosResponse<any, any>> {
        return axios.get(this.simple_join_uri(this.base_uri, uri), opts);
    }
    public post(uri: string = "", opts: { [x: string]: any } = {}): Promise<AxiosResponse<any, any>> {
        return axios.post(this.simple_join_uri(this.base_uri, uri), opts);
    }
    protected simple_join_uri(base: string, endpoint: string): string {
        return base + "/" + endpoint
    }
}

export default HTTPAgent;
