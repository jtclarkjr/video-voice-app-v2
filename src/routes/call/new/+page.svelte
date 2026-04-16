<script lang="ts">
	import CallPage from '$lib/components/call/CallPage.svelte';
	import type { AuthConfig } from '$lib/server/auth-config';

	let { data } = $props<{ data: { authConfig: AuthConfig } }>();
</script>

<CallPage roomId="" isCreateFlow authConfig={data.authConfig} />
