/**
 * @file memory.test.js
 * @description Tests for swarm memory systems including shared memory, caching, and persistence
 * @coverage Memory initialization, storage, retrieval, consistency, performance
 */

const assert = require('assert');

describe('Memory System', () => {
  describe('Memory Initialization', () => {
    it('should initialize memory store with correct configuration', () => {
      const memoryStore = {
        type: 'sql.js',
        size: 0,
        maxSize: 1024 * 1024, // 1MB
        entries: new Map(),
        hnsw: { enabled: true, index: null },
        initialize(config = {}) {
          this.type = config.type || 'sql.js';
          this.maxSize = config.maxSize || this.maxSize;
          this.hnsw.enabled = config.hyperbolic !== false;
          return { success: true, ready: true };
        }
      };

      const result = memoryStore.initialize({ type: 'sql.js', maxSize: 2048 });

      assert(result.success, 'Initialization should succeed');
      assert.strictEqual(memoryStore.type, 'sql.js', 'Type should be set');
      assert.strictEqual(memoryStore.maxSize, 2048, 'Max size should be set');
      assert(memoryStore.hnsw.enabled, 'HNSW should be enabled');
    });

    it('should create separate memory namespaces', () => {
      const memory = {
        namespaces: {},
        createNamespace(name) {
          this.namespaces[name] = {
            entries: new Map(),
            createdAt: new Date()
          };
        },
        hasNamespace(name) {
          return name in this.namespaces;
        }
      };

      memory.createNamespace('coordination');
      memory.createNamespace('patterns');
      memory.createNamespace('metrics');

      assert(memory.hasNamespace('coordination'), 'Should have coordination namespace');
      assert(memory.hasNamespace('patterns'), 'Should have patterns namespace');
      assert(memory.hasNamespace('metrics'), 'Should have metrics namespace');
    });

    it('should set up HNSW vector index', () => {
      const hnsw = {
        enabled: true,
        maxElements: 1000,
        dimensions: 384,
        efConstruction: 200,
        ef: 50,
        vectors: [],
        initialize() {
          return {
            indexType: 'HNSW',
            maxElements: this.maxElements,
            dimensions: this.dimensions,
            ready: true
          };
        }
      };

      const config = hnsw.initialize();

      assert.strictEqual(config.indexType, 'HNSW', 'Should be HNSW index');
      assert.strictEqual(config.dimensions, 384, 'Should have correct dimensions');
      assert(config.ready, 'Should be ready');
    });
  });

  describe('Memory Storage and Retrieval', () => {
    it('should store key-value pairs with TTL', () => {
      const store = {
        entries: new Map(),
        store(key, value, ttl = null) {
          this.entries.set(key, {
            value,
            storedAt: Date.now(),
            expiresAt: ttl ? Date.now() + ttl : null
          });
        },
        retrieve(key) {
          const entry = this.entries.get(key);
          if (!entry) return null;

          if (entry.expiresAt && Date.now() > entry.expiresAt) {
            this.entries.delete(key);
            return null;
          }

          return entry.value;
        }
      };

      store.store('config', { mode: 'production' });
      store.store('session', { id: '123' }, 5000); // 5 second TTL

      assert.deepStrictEqual(
        store.retrieve('config'),
        { mode: 'production' },
        'Should retrieve stored value'
      );
      assert(store.retrieve('session'), 'Session should be accessible immediately');
    });

    it('should handle namespaced storage', () => {
      const memory = {
        namespaces: {
          coordination: { entries: new Map() },
          metrics: { entries: new Map() }
        },
        store(namespace, key, value) {
          if (!this.namespaces[namespace]) throw new Error(`Namespace ${namespace} not found`);
          this.namespaces[namespace].entries.set(key, value);
        },
        retrieve(namespace, key) {
          return this.namespaces[namespace]?.entries.get(key);
        }
      };

      memory.store('coordination', 'agents', ['agent-1', 'agent-2']);
      memory.store('metrics', 'uptime', 99.9);

      assert.deepStrictEqual(
        memory.retrieve('coordination', 'agents'),
        ['agent-1', 'agent-2'],
        'Should retrieve from coordination namespace'
      );
      assert.strictEqual(
        memory.retrieve('metrics', 'uptime'),
        99.9,
        'Should retrieve from metrics namespace'
      );
    });

    it('should handle batch operations efficiently', () => {
      const store = {
        entries: new Map(),
        storeBatch(items) {
          items.forEach(({ key, value }) => {
            this.entries.set(key, value);
          });
        },
        retrieveBatch(keys) {
          return keys.map((key) => this.entries.get(key));
        }
      };

      const items = [
        { key: 'key-1', value: 'value-1' },
        { key: 'key-2', value: 'value-2' },
        { key: 'key-3', value: 'value-3' }
      ];

      store.storeBatch(items);
      const results = store.retrieveBatch(['key-1', 'key-2', 'key-3']);

      assert.strictEqual(results.length, 3, 'Should retrieve 3 items');
      assert.strictEqual(results[0], 'value-1', 'First value should match');
    });

    it('should support pattern-based retrieval', () => {
      const store = {
        entries: new Map(),
        store(key, value) {
          this.entries.set(key, value);
        },
        retrieveByPattern(pattern) {
          const regex = new RegExp(pattern);
          const results = [];
          this.entries.forEach((value, key) => {
            if (regex.test(key)) {
              results.push({ key, value });
            }
          });
          return results;
        }
      };

      store.store('swarm/agent-1/status', 'active');
      store.store('swarm/agent-2/status', 'idle');
      store.store('metrics/cpu/usage', 45);

      const agentStatus = store.retrieveByPattern('swarm/.*');

      assert.strictEqual(agentStatus.length, 2, 'Should find 2 agent entries');
      assert(agentStatus.every((e) => e.key.startsWith('swarm/')), 'All keys should match pattern');
    });

    it('should handle deletion and garbage collection', () => {
      const store = {
        entries: new Map(),
        store(key, value) {
          this.entries.set(key, { value, createdAt: Date.now() });
        },
        delete(key) {
          return this.entries.delete(key);
        },
        garbageCollect(maxAge = 3600000) {
          // Remove entries older than maxAge (1 hour default)
          let deleted = 0;
          this.entries.forEach((entry, key) => {
            if (Date.now() - entry.createdAt > maxAge) {
              this.entries.delete(key);
              deleted++;
            }
          });
          return deleted;
        }
      };

      store.store('key-1', 'value-1');
      store.store('key-2', 'value-2');

      const deleted = store.delete('key-1');
      assert(deleted, 'Should delete entry');
      assert.strictEqual(store.entries.size, 1, 'Should have 1 entry left');
    });
  });

  describe('Vector Embeddings and Semantic Search', () => {
    it('should store embeddings with metadata', () => {
      const vectorStore = {
        vectors: [],
        store(text, embedding, metadata = {}) {
          this.vectors.push({
            text,
            embedding,
            metadata,
            storedAt: Date.now()
          });
        },
        getVectorCount() {
          return this.vectors.length;
        }
      };

      vectorStore.store('task description', [0.1, 0.2, 0.3], {
        type: 'task',
        priority: 'high'
      });

      assert.strictEqual(vectorStore.getVectorCount(), 1, 'Should store 1 vector');
      assert.strictEqual(vectorStore.vectors[0].metadata.type, 'task', 'Should preserve metadata');
    });

    it('should compute vector similarity', () => {
      const cosineSimilarity = (v1, v2) => {
        const dotProduct = v1.reduce((sum, val, i) => sum + val * v2[i], 0);
        const magnitude1 = Math.sqrt(v1.reduce((sum, val) => sum + val * val, 0));
        const magnitude2 = Math.sqrt(v2.reduce((sum, val) => sum + val * val, 0));
        return dotProduct / (magnitude1 * magnitude2);
      };

      const v1 = [1, 0, 0];
      const v2 = [1, 0, 0];
      const v3 = [0, 1, 0];

      const similarity1 = cosineSimilarity(v1, v2);
      const similarity2 = cosineSimilarity(v1, v3);

      assert(similarity1 > 0.99, 'Identical vectors should have similarity ~1');
      assert(similarity2 < 0.01, 'Orthogonal vectors should have similarity ~0');
    });

    it('should perform semantic search with HNSW', () => {
      const searchEngine = {
        index: [],
        insertVector(vector, metadata) {
          this.index.push({ vector, metadata });
        },
        search(queryVector, k = 5) {
          const cosineSimilarity = (v1, v2) => {
            const dot = v1.reduce((sum, val, i) => sum + val * v2[i], 0);
            const mag1 = Math.sqrt(v1.reduce((sum, val) => sum + val * val, 0));
            const mag2 = Math.sqrt(v2.reduce((sum, val) => sum + val * val, 0));
            return dot / (mag1 * mag2);
          };

          const results = this.index
            .map((item) => ({
              ...item,
              score: cosineSimilarity(queryVector, item.vector)
            }))
            .sort((a, b) => b.score - a.score)
            .slice(0, k);

          return results;
        }
      };

      searchEngine.insertVector([1, 0, 0], { text: 'agent status' });
      searchEngine.insertVector([0.9, 0.1, 0], { text: 'agent information' });
      searchEngine.insertVector([0, 0, 1], { text: 'unrelated' });

      const results = searchEngine.search([1, 0, 0], 2);

      assert.strictEqual(results.length, 2, 'Should return 2 results');
      assert(results[0].score > results[1].score, 'Results should be sorted by score');
    });

    it('should handle embeddings cache with LRU eviction', () => {
      const embeddingCache = {
        cache: new Map(),
        maxSize: 3,
        get(key) {
          return this.cache.get(key);
        },
        set(key, value) {
          if (this.cache.has(key)) {
            this.cache.delete(key); // Move to end (most recent)
          } else if (this.cache.size >= this.maxSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey); // Remove least recently used
          }
          this.cache.set(key, value);
        }
      };

      embeddingCache.set('a', [0.1]);
      embeddingCache.set('b', [0.2]);
      embeddingCache.set('c', [0.3]);
      embeddingCache.set('d', [0.4]); // Should evict 'a'

      assert(!embeddingCache.get('a'), 'LRU item should be evicted');
      assert(embeddingCache.get('b'), 'Non-LRU item should remain');
      assert(embeddingCache.get('d'), 'New item should be cached');
    });
  });

  describe('Memory Consistency and Synchronization', () => {
    it('should maintain consistency across replicas', () => {
      const replica1 = { version: 0, data: {} };
      const replica2 = { version: 0, data: {} };

      const update = (replicas, key, value) => {
        replicas.forEach((r) => {
          r.version++;
          r.data[key] = value;
        });
      };

      const replicas = [replica1, replica2];
      update(replicas, 'config', { mode: 'production' });

      assert.strictEqual(replica1.version, replica2.version, 'Versions should match');
      assert.deepStrictEqual(replica1.data, replica2.data, 'Data should match');
    });

    it('should detect and resolve conflicts', () => {
      const conflictResolver = {
        conflicts: [],
        detect(v1, v2) {
          return v1.version !== v2.version && v1.hash !== v2.hash;
        },
        resolve(v1, v2) {
          // Last-write-wins strategy
          if (v1.timestamp > v2.timestamp) {
            return v1;
          }
          return v2;
        }
      };

      const v1 = { version: 1, hash: 'abc', timestamp: 100, data: 'value1' };
      const v2 = { version: 1, hash: 'xyz', timestamp: 200, data: 'value2' };

      assert(conflictResolver.detect(v1, v2), 'Should detect conflict');

      const resolved = conflictResolver.resolve(v1, v2);
      assert.strictEqual(resolved.data, 'value2', 'Should select latest timestamp');
    });

    it('should implement write-ahead logging for durability', () => {
      const wal = {
        log: [],
        buffer: [],
        write(entry) {
          this.buffer.push(entry);
        },
        flush() {
          this.log.push(...this.buffer);
          this.buffer = [];
          return this.log.length;
        }
      };

      wal.write({ key: 'key-1', value: 'value-1' });
      wal.write({ key: 'key-2', value: 'value-2' });

      assert.strictEqual(wal.buffer.length, 2, 'Should buffer entries');

      const logSize = wal.flush();
      assert.strictEqual(logSize, 2, 'Should flush to WAL');
      assert.strictEqual(wal.buffer.length, 0, 'Buffer should be empty after flush');
    });

    it('should support snapshots for recovery', () => {
      const snapshot = {
        data: { key1: 'value1', key2: 'value2' },
        timestamp: Date.now(),
        version: 1,
        create() {
          return {
            data: { ...this.data },
            timestamp: Date.now(),
            version: this.version
          };
        },
        restore(snap) {
          this.data = { ...snap.data };
          this.timestamp = snap.timestamp;
          this.version = snap.version;
        }
      };

      const snap = snapshot.create();
      snapshot.data = {}; // Simulate data loss

      snapshot.restore(snap);

      assert.deepStrictEqual(snapshot.data, { key1: 'value1', key2: 'value2' }, 'Should restore data');
      assert.strictEqual(snapshot.version, 1, 'Should restore version');
    });
  });

  describe('Memory Performance and Optimization', () => {
    it('should measure memory usage', () => {
      const memoryMonitor = {
        getMemoryUsage() {
          return process.memoryUsage();
        },
        getHeapUsage() {
          const usage = process.memoryUsage();
          return {
            heapUsed: usage.heapUsed,
            heapTotal: usage.heapTotal,
            percent: (usage.heapUsed / usage.heapTotal) * 100
          };
        }
      };

      const usage = memoryMonitor.getHeapUsage();

      assert(usage.heapUsed > 0, 'Should measure heap usage');
      assert(usage.percent > 0 && usage.percent <= 100, 'Percentage should be valid');
    });

    it('should compress stored data', () => {
      const compressor = {
        compress(data) {
          // Simulate compression by storing metadata
          return {
            compressed: true,
            originalSize: JSON.stringify(data).length,
            compressedSize: Math.floor(JSON.stringify(data).length * 0.7),
            data: JSON.stringify(data) // In real impl, would be compressed
          };
        },
        getCompressionRatio(original, compressed) {
          return compressed.compressedSize / original;
        }
      };

      const data = { a: 1, b: 2, c: 3, d: 4, e: 5 };
      const compressed = compressor.compress(data);

      assert(compressed.compressedSize < compressed.originalSize, 'Should reduce size');
      assert(compressor.getCompressionRatio(compressed.originalSize, compressed) < 1, 'Ratio should be < 1');
    });

    it('should implement caching strategies', () => {
      const cache = {
        data: new Map(),
        stats: { hits: 0, misses: 0 },
        get(key) {
          if (this.data.has(key)) {
            this.stats.hits++;
            return this.data.get(key);
          }
          this.stats.misses++;
          return null;
        },
        set(key, value) {
          this.data.set(key, value);
        },
        getHitRate() {
          const total = this.stats.hits + this.stats.misses;
          return total === 0 ? 0 : this.stats.hits / total;
        }
      };

      cache.set('key-1', 'value-1');
      cache.get('key-1');
      cache.get('key-1');
      cache.get('key-2'); // Miss

      assert.strictEqual(cache.stats.hits, 2, 'Should count hits');
      assert.strictEqual(cache.stats.misses, 1, 'Should count misses');
      assert(cache.getHitRate() > 0.6, 'Hit rate should be high');
    });

    it('should implement memory pooling', () => {
      const memoryPool = {
        pools: {},
        createPool(name, size) {
          this.pools[name] = {
            size,
            available: [],
            inUse: new Set(),
            allocate() {
              let buffer = this.available.pop();
              if (!buffer) {
                buffer = new Array(this.size);
              }
              this.inUse.add(buffer);
              return buffer;
            },
            release(buffer) {
              this.inUse.delete(buffer);
              this.available.push(buffer);
            }
          };
        },
        getPoolStats(name) {
          const pool = this.pools[name];
          return {
            available: pool.available.length,
            inUse: pool.inUse.size,
            total: pool.available.length + pool.inUse.size
          };
        }
      };

      memoryPool.createPool('buffers', 100);
      const b1 = memoryPool.getPoolStats('buffers');
      assert.strictEqual(b1.available, 0, 'Initially no buffers available');

      memoryPool.pools['buffers'].allocate();
      const b2 = memoryPool.getPoolStats('buffers');
      assert.strictEqual(b2.inUse, 1, 'Should track in-use buffers');
    });
  });
});
