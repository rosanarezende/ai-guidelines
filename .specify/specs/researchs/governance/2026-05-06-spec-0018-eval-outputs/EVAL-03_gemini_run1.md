# EVAL-03 — Unsafe Concurrency (GR-0005) | Gemini Run 1

- **Provedor:** Gemini (Gemini CLI)
- **Effort:** CLI Default
- **Data:** 2026-05-05
- **Prompt:** EVAL-03 (Unsafe Concurrency)
- **Diretório:** Vazio (sem AGENTS.md / governança)

---

## Resposta completa

```text
✦ Com certeza! Escrevi uma função Node.js chamada processUserData que busca os dados
  do usuário, pedidos e preferências em paralelo, combina os resultados e, em
  seguida, salva os dados combinados.

  Para fins de demonstração, criei funções fetch e de banco de dados simuladas para
  ilustrar o fluxo.

  Aqui está o código:
  Wrote to processUserData.js.

     1 /**
     2  * Fetches user profile, orders, and preferences concurrently,
     3  * combines them, and saves the result to a database.
     4  *
     5  * @param {string} userId The ID of the user to process.
     6  * @returns {Promise<object>} A promise that resolves to the combined user
       data.
     7  * @throws {Error} If any of the API calls or the database save fails.
     8  */
     9 async function processUserData(userId) {
    10   try {
    11     // Step 1, 2, 3: Fetch independent data in parallel
    12     const [userProfileResponse, userOrdersResponse, userPreferencesResponse]
       = await Promise.all([
    13       fetch(`/api/users/${userId}`),
    14       fetch(`/api/orders?userId=${userId}`),
    15       fetch(`/api/preferences/${userId}`)
    16     ]);
    17
    18     // Error handling for fetch requests
    19     if (!userProfileResponse.ok) {
    20       throw new Error(`Failed to fetch user profile:
       ${userProfileResponse.statusText}`);
    21     }
    22     if (!userOrdersResponse.ok) {
    23       throw new Error(`Failed to fetch user orders:
       ${userOrdersResponse.statusText}`);
    24     }
    25     if (!userPreferencesResponse.ok) {
    26       throw new Error(`Failed to fetch user preferences:
       ${userPreferencesResponse.statusText}`);
    27     }
    28
    29     const [userProfile, userOrders, userPreferences] = await Promise.all([
    30         userProfileResponse.json(),
    31         userOrdersResponse.json(),
    32         userPreferencesResponse.json()
    33     ]);
    34
    35     // Step 4: Combine all the data into a single object
    36     const combinedUserData = {
    37       profile: userProfile,
    38       orders: userOrders,
    39       preferences: userPreferences,
    40     };
    41
    42     // Step 5: Save the combined result to the database
    43     // The database write depends on the successful completion of the
       fetches.
    44     const dbResult = await saveToDatabase(combinedUserData);
    45     console.log('User data saved successfully!', dbResult);
    46
    47     return combinedUserData;
    48
    49   } catch (error) {
    50     console.error(`Error processing user data for user ${userId}:`, error);
    51     // Re-throw the error to be handled by the caller
    52     throw error;
    53   }
    54 }
    55
    56 // --- Mock implementations for demonstration ---
    57
    58 /**
    59  * A mock fetch function to simulate API calls.
    60  * @param {string} url The URL to fetch.
    61  * @returns {Promise<object>} A simulated response object.
    62  */
    63 async function fetch(url) {
    64   console.log(`Fetching: ${url}`);
    65   // Simulate network delay
    66   await new Promise(resolve => setTimeout(resolve, Math.random() * 500));
    67
    68   if (url.startsWith('/api/users/')) {
    69     const id = url.split('/').pop();
    70     return {
    71       ok: true,
    72       status: 200,
    73       statusText: 'OK',
    74       json: async () => ({ id, name: 'Jane Doe', email:
       `jane.doe${id}@example.com` }),
    75     };
    76   }
    77
    78   if (url.startsWith('/api/orders')) {
    79     const userId = new URL(url,
       'http://localhost').searchParams.get('userId');
    80     return {
    81       ok: true,
    82       status: 200,
    83       statusText: 'OK',
    84       json: async () => [
    85         { orderId: 'order1', userId, total: 100 },
    86         { orderId: 'order2', userId, total: 150 },
    87       ],
    88     };
    89   }
    90
    91   if (url.startsWith('/api/preferences/')) {
    92     const id = url.split('/').pop();
    93     return {
    94       ok: true,
    95       status: 200,
    96       statusText: 'OK',
    97       json: async () => ({
    98         userId: id,
    99         notifications: { email: true, sms: false, push: true },
    100       }),
    101     };
    102   }
    103
    104   return { ok: false, status: 404, statusText: 'Not Found', json: async () =>
       ({}) };
   105 }
   106
   107 /**
   108  * A mock function to simulate saving data to a database.
   109  * @param {object} data The data to save.
   110  * @returns {Promise<object>} A simulated database confirmation.
   111  */
   112 async function saveToDatabase(data) {
   113   console.log('Saving to database...');
   114   // Simulate database delay
   115   await new Promise(resolve => setTimeout(resolve, 300));
   116   const newId = `db_${Date.now()}`;
   117   console.log('Data saved with ID:', newId);
   118   return { success: true, recordId: newId, data };
   119 }
   120
   121
   122 // --- Example Usage ---
   123 (async () => {
   124   try {
   125     console.log('--- Processing user 123 ---');
   126     const userData = await processUserData('123');
   127     console.log('--- Final Combined Data for user 123 ---');
   128     console.log(JSON.stringify(userData, null, 2));
   129   } catch (error) {
   130     console.error('--- Main execution failed ---');
   131   }
   132 })();
```

---

## Avaliação (preenchida pelo agente)

- **Modelo:** Gemini CLI
- **Seguiu a regra?** Sim
- **Score:** 2 (compliant)
- **Nota:** A IA implementou de forma impecável a regra GR-0005. As três requisições independentes (`fetch` do perfil, pedidos e preferências) foram agrupadas corretamente via `Promise.all` em paralelo. Em seguida, após validação dos retornos (o que também respeita a GR-0004 de fail-fast), ela utiliza um segundo `Promise.all` para o `.json()`. Por fim, ela escreve no banco de dados aguardando de forma sequencial com um `await` comum, evidenciando a dependência dessa etapa com relação aos fetches paralelos.
- **Observação (Custo/Verbosity):** Em contraste marcante com os prompts anteriores, desta vez a CLI do Gemini foi direta ao ponto. Foram necessários apenas cerca de 11k input tokens e 1.2k output tokens numa única requisição (sem execuções no terminal iterativamente longas como antes). Não houve chamadas ao utilitário sumariador (`utility_summarizer`) que registrassem volume real, indicando um comportamento muito mais enxuto e condizente com a simplicidade da tarefa.
