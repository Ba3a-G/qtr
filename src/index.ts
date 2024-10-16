async function _getTokenFromId(id: string, account_id: string, api_key: string): Promise<string> {
	const options = {
		method: 'GET',
		headers: {'Content-Type': 'application', 'Authorization': `Bearer ${api_key}`}
	};
	let response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${account_id}/cfd_tunnel/${id}/token`, options);
	let data: any = await response.json();
	return data.result;
};

async function _getTunnelToken(name: string, account_id: string, api_key: string): Promise<string> {
	const options = {
		method: 'GET',
		headers: {'Content-Type': 'application', 'Authorization': `Bearer ${api_key}`}
	};
	let response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${account_id}/cfd_tunnel`, options);
	let data: any = await response.json();
	let tunnels: any[] = data.result;
	for (let i = 0; i < tunnels.length; i++) {
		if (tunnels[i].name === name) {
			let id: string = tunnels[i].id;
			return await _getTokenFromId(id, account_id, api_key);
		}
	}
	return '';
}

export default {
	async fetch(request, env, ctx): Promise<Response> {
		// @ts-ignore
		let account_id: string = env.ACCOUNT_ID;
		// @ts-ignore
		let api_key: string = env.API_KEY;
		let name: string = request.url.split('/')[3];
		if (!name) {
			return new Response(`echo "connector name required"`, { status: 400 });
		}

		let installUfwScript: string = `sudo pacman -S ufw`;
		let allowPort22: string = `sudo ufw allow 22/tcp`;
		let serviceInstall: string = `sudo cloudflared service install`;
		let cloudflaredInstall: string = `sudo pacman -S cloudflared`;
		name = "qt_" + name;

		let tunnelToken: string = await _getTunnelToken(name, account_id, api_key);
		if (tunnelToken) {
			return new Response(`${installUfwScript} && \n${allowPort22} && \n${cloudflaredInstall} && \n${serviceInstall} ${tunnelToken}\n`, { status: 200 });
		}
		const options = {
			method: 'POST',
			headers: {'Content-Type': 'application/json', 'Authorization': `Bearer ${api_key}`},
			body: `{"config_src":"cloudflare","name":"${name}","tunnel_secret":"bXlzZWNyZXRwYXNzZm9yY2xvdWRmbGFyZQ=="}`
		};
		let response: any = await fetch(`https://api.cloudflare.com/client/v4/accounts/${account_id}/cfd_tunnel`, options);
		let data: any = await response.json();
		tunnelToken = data.result.token;
		return new Response(`${installUfwScript} && \n${allowPort22} && \n${cloudflaredInstall} && \n${serviceInstall} ${tunnelToken}\n`, { status: 200 });
	},
} satisfies ExportedHandler<Env>;
