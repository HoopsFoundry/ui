<script lang="ts">
  // Testhilfe: Auslöser, Seite und ein Svelte-Modal, das der Auslöser öffnet.
  import Modal from '../../svelte/Modal.svelte';
  let open = $state(false);
</script>

<button type="button" id="auf" onclick={() => (open = true)}>Auf</button>
<main id="seite"><a href="#x" id="seitenlink">Seite</a></main>
<Modal bind:open title="Titel">Inhalt</Modal>
