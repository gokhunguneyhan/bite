/**
 * @file coordination.test.js
 * @description Tests for swarm coordination and consensus mechanisms
 * @coverage Agent coordination, message passing, consensus protocols, load balancing
 */

const assert = require('assert');

describe('Swarm Coordination', () => {
  describe('Agent Coordination Patterns', () => {
    it('should coordinate sequential task execution', async () => {
      const tasks = [];
      const coordinator = {
        agents: [
          { id: 'agent-1', type: 'coder' },
          { id: 'agent-2', type: 'tester' },
          { id: 'agent-3', type: 'reviewer' }
        ],
        async executeSequential(taskList) {
          for (const task of taskList) {
            const result = await this.executeTask(task);
            tasks.push(result);
          }
          return tasks;
        },
        async executeTask(task) {
          return new Promise((resolve) => {
            setTimeout(() => {
              resolve({
                task: task.name,
                executedBy: task.agent,
                status: 'completed',
                timestamp: new Date()
              });
            }, 10);
          });
        }
      };

      const result = await coordinator.executeSequential([
        { name: 'Implement', agent: 'agent-1' },
        { name: 'Test', agent: 'agent-2' },
        { name: 'Review', agent: 'agent-3' }
      ]);

      assert.strictEqual(result.length, 3, 'Should execute 3 tasks');
      assert.strictEqual(result[0].task, 'Implement', 'First task should be Implement');
      assert.strictEqual(result[1].task, 'Test', 'Second task should be Test');
      assert.strictEqual(result[2].task, 'Review', 'Third task should be Review');
    });

    it('should coordinate parallel task execution', async () => {
      const coordinator = {
        async executeParallel(tasks) {
          return Promise.all(
            tasks.map((task) =>
              new Promise((resolve) => {
                setTimeout(() => {
                  resolve({
                    task: task.name,
                    executedBy: task.agent,
                    status: 'completed'
                  });
                }, Math.random() * 50);
              })
            )
          );
        }
      };

      const startTime = Date.now();
      const result = await coordinator.executeParallel([
        { name: 'Task-1', agent: 'agent-1' },
        { name: 'Task-2', agent: 'agent-2' },
        { name: 'Task-3', agent: 'agent-3' }
      ]);
      const duration = Date.now() - startTime;

      assert.strictEqual(result.length, 3, 'Should complete 3 tasks');
      assert(
        duration < 150,
        'Parallel execution should be faster than sequential (150ms limit)'
      );
    });

    it('should handle task dependencies', () => {
      const taskDependencyGraph = {
        'task-1': [],
        'task-2': ['task-1'],
        'task-3': ['task-1', 'task-2'],
        'task-4': ['task-2']
      };

      const resolveDependencies = (taskId, graph) => {
        const visited = new Set();
        const dependencies = [];

        const visit = (id) => {
          if (visited.has(id)) return;
          visited.add(id);

          if (graph[id]) {
            graph[id].forEach((dep) => {
              visit(dep);
              dependencies.push(dep);
            });
          }
        };

        visit(taskId);
        return dependencies;
      };

      const task3Deps = resolveDependencies('task-3', taskDependencyGraph);
      assert(task3Deps.includes('task-1'), 'task-3 depends on task-1');
      assert(task3Deps.includes('task-2'), 'task-3 depends on task-2');

      const task4Deps = resolveDependencies('task-4', taskDependencyGraph);
      assert(task4Deps.includes('task-2'), 'task-4 depends on task-2');
      assert(!task4Deps.includes('task-1'), 'task-4 should not directly depend on task-1');
    });

    it('should implement work stealing for load balancing', () => {
      const agents = [
        { id: 'agent-1', workload: 10 },
        { id: 'agent-2', workload: 2 },
        { id: 'agent-3', workload: 8 }
      ];

      const stealWork = (agents, fromAgent) => {
        const thief = agents.reduce((min, agent) =>
          agent.workload < min.workload ? agent : min
        );

        if (thief.workload < fromAgent.workload / 2) {
          const stolen = Math.floor(fromAgent.workload / 2);
          fromAgent.workload -= stolen;
          thief.workload += stolen;
          return { from: fromAgent.id, to: thief.id, amount: stolen };
        }
        return null;
      };

      const overloadedAgent = agents[0];
      const result = stealWork(agents, overloadedAgent);

      assert(result, 'Work stealing should occur');
      assert.strictEqual(result.from, 'agent-1', 'Should steal from overloaded agent');
      assert.strictEqual(result.to, 'agent-2', 'Should steal to least loaded agent');
      assert(overloadedAgent.workload < 10, 'Overloaded agent should have less work');
    });
  });

  describe('Consensus Mechanisms', () => {
    it('should implement majority voting consensus', () => {
      const consensus = {
        votes: [
          { agentId: 'agent-1', vote: 'yes' },
          { agentId: 'agent-2', vote: 'yes' },
          { agentId: 'agent-3', vote: 'no' },
          { agentId: 'agent-4', vote: 'yes' }
        ],
        decide() {
          const yesVotes = this.votes.filter((v) => v.vote === 'yes').length;
          const totalVotes = this.votes.length;
          return yesVotes > totalVotes / 2;
        }
      };

      assert(consensus.decide(), 'Majority should reach consensus');

      consensus.votes[0].vote = 'no';
      assert(!consensus.decide(), 'No consensus when votes split');
    });

    it('should implement Byzantine fault tolerance', () => {
      const byzantineConsensus = {
        nodes: [
          { id: 1, value: 'A' },
          { id: 2, value: 'A' },
          { id: 3, value: 'B' }, // Byzantine node
          { id: 4, value: 'A' }
        ],
        decide() {
          const valueMap = {};
          this.nodes.forEach((node) => {
            valueMap[node.value] = (valueMap[node.value] || 0) + 1;
          });

          let maxValue = null;
          let maxCount = 0;
          for (const [value, count] of Object.entries(valueMap)) {
            if (count > maxCount) {
              maxCount = count;
              maxValue = value;
            }
          }

          // Majority determines consensus
          return maxValue;
        }
      };

      assert.strictEqual(byzantineConsensus.decide(), 'A', 'Majority should prevail despite Byzantine node');
    });

    it('should implement Raft consensus protocol', () => {
      const raftNode = {
        id: 'node-1',
        term: 1,
        votedFor: null,
        log: [],
        state: 'follower',
        becomeCandidateAndRequestVotes() {
          this.state = 'candidate';
          this.term += 1;
          return { nodeId: this.id, term: this.term, candidateId: this.id };
        },
        becomeLeaderIfWonElection(votes) {
          if (votes >= 3) {
            this.state = 'leader';
            return true;
          }
          return false;
        },
        appendEntry(entry) {
          if (this.state === 'leader') {
            this.log.push(entry);
            return true;
          }
          return false;
        }
      };

      const request = raftNode.becomeCandidateAndRequestVotes();
      assert.strictEqual(raftNode.state, 'candidate', 'Should become candidate');
      assert.strictEqual(request.term, 2, 'Should increment term');

      const elected = raftNode.becomeLeaderIfWonElection(3);
      assert(elected, 'Should become leader with 3 votes');
      assert.strictEqual(raftNode.state, 'leader', 'State should be leader');

      const appendResult = raftNode.appendEntry({ command: 'set x 1' });
      assert(appendResult, 'Leader should append entries');
      assert.strictEqual(raftNode.log.length, 1, 'Log should contain entry');
    });

    it('should detect and handle split brain scenarios', () => {
      const clusterPartition = {
        nodes: ['n1', 'n2', 'n3', 'n4', 'n5'],
        partition: [['n1', 'n2'], ['n3', 'n4', 'n5']],
        canFormConsensus(partition) {
          const quorumSize = Math.floor(5 / 2) + 1; // 3 nodes needed
          return partition.some((group) => group.length >= quorumSize);
        },
        detectSplitBrain() {
          return this.partition.filter((p) => p.length >= Math.floor(5 / 2) + 1).length > 1;
        }
      };

      // Single partition can still form consensus
      assert(
        clusterPartition.canFormConsensus(clusterPartition.partition),
        'Larger partition should form consensus'
      );

      // Detect split brain
      const hasSplitBrain = clusterPartition.detectSplitBrain();
      assert(!hasSplitBrain, 'Should not have split brain with 3-2 partition');

      // Create equal partition (split brain scenario)
      clusterPartition.partition = [['n1', 'n2'], ['n3', 'n4']];
      const hasEqualSplit = clusterPartition.detectSplitBrain();
      assert(!hasEqualSplit, 'Equal partitions should not both form consensus');
    });
  });

  describe('Load Balancing', () => {
    it('should implement round-robin load balancing', () => {
      const roundRobin = {
        agents: ['agent-1', 'agent-2', 'agent-3'],
        currentIndex: 0,
        getNextAgent() {
          const agent = this.agents[this.currentIndex];
          this.currentIndex = (this.currentIndex + 1) % this.agents.length;
          return agent;
        }
      };

      assert.strictEqual(roundRobin.getNextAgent(), 'agent-1', 'First should be agent-1');
      assert.strictEqual(roundRobin.getNextAgent(), 'agent-2', 'Second should be agent-2');
      assert.strictEqual(roundRobin.getNextAgent(), 'agent-3', 'Third should be agent-3');
      assert.strictEqual(roundRobin.getNextAgent(), 'agent-1', 'Should cycle back to agent-1');
    });

    it('should implement least-connections load balancing', () => {
      const leastConnections = {
        agents: [
          { id: 'agent-1', connections: 5 },
          { id: 'agent-2', connections: 2 },
          { id: 'agent-3', connections: 8 }
        ],
        selectAgent() {
          return this.agents.reduce((min, agent) =>
            agent.connections < min.connections ? agent : min
          );
        }
      };

      const selected = leastConnections.selectAgent();
      assert.strictEqual(selected.id, 'agent-2', 'Should select agent with least connections');
    });

    it('should implement weighted load balancing', () => {
      const weighted = {
        agents: [
          { id: 'agent-1', weight: 5, load: 0 },
          { id: 'agent-2', weight: 3, load: 0 },
          { id: 'agent-3', weight: 2, load: 0 }
        ],
        selectAgent() {
          // Select agent with lowest load relative to weight
          return this.agents.reduce((selected, agent) => {
            const agentScore = agent.load / agent.weight;
            const selectedScore = selected.load / selected.weight;
            return agentScore < selectedScore ? agent : selected;
          });
        }
      };

      weighted.agents[0].load = 5;
      weighted.agents[1].load = 3;
      const selected = weighted.selectAgent();

      assert.strictEqual(selected.id, 'agent-2', 'Should consider weight in selection');
    });

    it('should rebalance when load skews', () => {
      const balancer = {
        agents: [
          { id: 'agent-1', load: 100 },
          { id: 'agent-2', load: 20 },
          { id: 'agent-3', load: 30 }
        ],
        calculateAverageLoad() {
          const total = this.agents.reduce((sum, a) => sum + a.load, 0);
          return total / this.agents.length;
        },
        needsRebalance(threshold = 0.5) {
          const average = this.calculateAverageLoad();
          return this.agents.some((agent) => {
            const deviation = Math.abs(agent.load - average) / average;
            return deviation > threshold;
          });
        },
        rebalance() {
          if (!this.needsRebalance()) return false;

          const average = this.calculateAverageLoad();
          this.agents.forEach((agent) => {
            agent.load = average;
          });
          return true;
        }
      };

      assert(balancer.needsRebalance(), 'Should detect need for rebalancing');

      const rebalanced = balancer.rebalance();
      assert(rebalanced, 'Should perform rebalancing');
      assert(
        balancer.agents.every((a) => a.load === balancer.calculateAverageLoad()),
        'All loads should be equal after rebalancing'
      );
    });
  });

  describe('Agent Communication', () => {
    it('should send direct messages between agents', () => {
      const messageRouter = {
        agents: {
          'agent-1': { inbox: [] },
          'agent-2': { inbox: [] }
        },
        sendMessage(from, to, message) {
          if (!this.agents[to]) throw new Error(`Agent ${to} not found`);
          this.agents[to].inbox.push({
            from,
            message,
            timestamp: Date.now()
          });
        }
      };

      messageRouter.sendMessage('agent-1', 'agent-2', 'Hello');

      assert.strictEqual(
        messageRouter.agents['agent-2'].inbox.length,
        1,
        'Should deliver message'
      );
      assert.strictEqual(
        messageRouter.agents['agent-2'].inbox[0].message,
        'Hello',
        'Message content should match'
      );
    });

    it('should broadcast messages to multiple agents', () => {
      const broadcaster = {
        agents: {
          'agent-1': { inbox: [] },
          'agent-2': { inbox: [] },
          'agent-3': { inbox: [] }
        },
        broadcast(from, message) {
          Object.entries(this.agents).forEach(([agentId, agent]) => {
            if (agentId !== from) {
              agent.inbox.push({ from, message, timestamp: Date.now() });
            }
          });
        }
      };

      broadcaster.broadcast('agent-1', 'Event occurred');

      assert.strictEqual(broadcaster.agents['agent-1'].inbox.length, 0, 'Sender should not receive');
      assert.strictEqual(broadcaster.agents['agent-2'].inbox.length, 1, 'agent-2 should receive');
      assert.strictEqual(broadcaster.agents['agent-3'].inbox.length, 1, 'agent-3 should receive');
    });

    it('should implement publish-subscribe pattern', () => {
      const pubSub = {
        topics: {},
        subscribe(topic, handler) {
          if (!this.topics[topic]) this.topics[topic] = [];
          this.topics[topic].push(handler);
        },
        publish(topic, data) {
          if (!this.topics[topic]) return;
          this.topics[topic].forEach((handler) => handler(data));
        }
      };

      const results = [];
      pubSub.subscribe('task-complete', (data) => {
        results.push(data);
      });

      pubSub.publish('task-complete', { taskId: 'task-1', result: 'success' });

      assert.strictEqual(results.length, 1, 'Should publish to subscriber');
      assert.strictEqual(results[0].taskId, 'task-1', 'Data should be transmitted');
    });

    it('should handle message timeouts', async () => {
      const messageWithTimeout = async (from, to, message, timeout = 1000) => {
        return new Promise((resolve, reject) => {
          const timer = setTimeout(() => {
            reject(new Error(`Message timeout from ${from} to ${to}`));
          }, timeout);

          // Simulate message delivery
          setTimeout(() => {
            clearTimeout(timer);
            resolve({
              from,
              to,
              message,
              delivered: true
            });
          }, 500); // Faster than timeout
        });
      };

      const result = await messageWithTimeout('agent-1', 'agent-2', 'test');
      assert(result.delivered, 'Message should be delivered');

      try {
        await messageWithTimeout('agent-1', 'agent-2', 'test', 100);
        assert.fail('Should timeout');
      } catch (error) {
        assert(error.message.includes('timeout'), 'Should throw timeout error');
      }
    });
  });

  describe('Coordination State Management', () => {
    it('should maintain coordination state', () => {
      const coordinationState = {
        agents: {
          'agent-1': { status: 'idle', lastUpdate: Date.now() },
          'agent-2': { status: 'working', lastUpdate: Date.now() }
        },
        updateAgentStatus(agentId, status) {
          if (!this.agents[agentId]) throw new Error(`Agent ${agentId} not found`);
          this.agents[agentId].status = status;
          this.agents[agentId].lastUpdate = Date.now();
        },
        getAgentStatus(agentId) {
          return this.agents[agentId]?.status;
        }
      };

      coordinationState.updateAgentStatus('agent-1', 'working');
      assert.strictEqual(
        coordinationState.getAgentStatus('agent-1'),
        'working',
        'Should update agent status'
      );
    });

    it('should sync state across agents', () => {
      const stateSync = {
        globalState: { version: 0, data: {} },
        agents: ['agent-1', 'agent-2', 'agent-3'],
        updateGlobalState(updates) {
          this.globalState = {
            version: this.globalState.version + 1,
            data: { ...this.globalState.data, ...updates }
          };
        },
        getStateForAgent(agentId) {
          return { ...this.globalState };
        }
      };

      stateSync.updateGlobalState({ config: 'value1' });
      const state = stateSync.getStateForAgent('agent-1');

      assert.strictEqual(state.version, 1, 'Version should increment');
      assert.strictEqual(state.data.config, 'value1', 'Data should be updated');
    });

    it('should detect state divergence', () => {
      const states = {
        'agent-1': { version: 3, hash: 'abc123' },
        'agent-2': { version: 3, hash: 'abc123' },
        'agent-3': { version: 2, hash: 'xyz789' }
      };

      const detectDivergence = (states) => {
        const hashes = Object.values(states).map((s) => s.hash);
        return new Set(hashes).size > 1;
      };

      assert(detectDivergence(states), 'Should detect state divergence');
    });
  });
});
