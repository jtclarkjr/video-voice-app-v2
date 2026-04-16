<script lang="ts">
	import CallPage from '$lib/components/call/CallPage.svelte';
	import type { AuthConfig } from '$lib/server/auth-config';

	let { data, params } = $props<{
		data: { authConfig: AuthConfig };
		params: { roomId: string };
	}>();
</script>

<CallPage roomId={params.roomId} authConfig={data.authConfig} />
