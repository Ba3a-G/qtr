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
		name = "qt_" + name;
		const options = {
			method: 'POST',
			headers: {'Content-Type': 'application/json', 'Authorization': `Bearer ${api_key}`},
			body: `{"config_src":"cloudflare","name":"${name}","tunnel_secret":"bXlzZWNyZXRwYXNzZm9yY2xvdWRmbGFyZQ=="}`
		};
		let response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${account_id}/cfd_tunnel`, options);
		let data: any = await response.json();
		let token: string = data.result.token;
		let script: string = `curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb && sudo dpkg -i cloudflared.deb && sudo cloudflared service install ${token}`;

		return new Response(script, { status: 200 });
	},
} satisfies ExportedHandler<Env>;
