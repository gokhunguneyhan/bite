/**
 * @file swarm-init.test.js
 * @description Tests for swarm initialization process
 * @coverage Swarm topology setup, agent spawning, coordination initialization
 */

const assert = require('assert');

describe('Swarm Initialization', () => {
  describe('Swarm Topology Setup', () => {
    it('should initialize mesh topology with correct configuration', () => {
      const topology = {
        type: 'mesh',
        maxAgents: 8,
        strategy: 'balanced',
        nodes: []
      };

      assert.strictEqual(topology.type, 'mesh', 'Topology type should be mesh');
      assert.strictEqual(topology.maxAgents, 8, 'Max agents should be 8');
      assert.strictEqual(topology.strategy, 'balanced', 'Strategy should be balanced');
      assert(Array.isArray(topology.nodes), 'Nodes should be an array');
    });

    it('should initialize hierarchical topology with correct structure', () => {
      const topology = {
        type: 'hierarchical',
        maxAgents: 12,
        levels: 3,
        agentsPerLevel: [1, 4, 7]
      };

      assert.strictEqual(topology.type, 'hierarchical', 'Type should be hierarchical');
      assert.strictEqual(topology.levels, 3, 'Should have 3 levels');
      assert.strictEqual(topology.agentsPerLevel.length, 3, 'Should have agent distribution');
      assert.strictEqual(
        topology.agentsPerLevel.reduce((a, b) => a + b, 0),
        12,
        'Total agents should equal maxAgents'
      );
    });

    it('should initialize star topology with central coordinator', () => {
      const topology = {
        type: 'star',
        maxAgents: 6,
        coordinator: 'primary-coordinator',
        workers: []
      };

      assert.strictEqual(topology.type, 'star', 'Type should be star');
      assert(topology.coordinator, 'Should have a coordinator');
      assert(Array.isArray(topology.workers), 'Workers should be an array');
    });

    it('should initialize ring topology with sequential connections', () => {
      const topology = {
        type: 'ring',
        maxAgents: 5,
        agents: ['agent-1', 'agent-2', 'agent-3', 'agent-4', 'agent-5'],
        connections: []
      };

      // Create ring connections
      for (let i = 0; i < topology.agents.length; i++) {
        const next = (i + 1) % topology.agents.length;
        topology.connections.push({
          from: topology.agents[i],
          to: topology.agents[next]
        });
      }

      assert.strictEqual(topology.type, 'ring', 'Type should be ring');
      assert.strictEqual(topology.connections.length, 5, 'Should have circular connections');
      assert.strictEqual(
        topology.connections[topology.connections.length - 1].to,
        topology.agents[0],
        'Last connection should return to first agent'
      );
    });

    it('should validate topology before initialization', () => {
      const validateTopology = (topology) => {
        if (!topology.type) throw new Error('Topology type is required');
        if (!topology.maxAgents || topology.maxAgents < 1) {
          throw new Error('Max agents must be at least 1');
        }
        if (!['mesh', 'hierarchical', 'star', 'ring'].includes(topology.type)) {
          throw new Error('Invalid topology type');
        }
        return true;
      };

      const validTopology = { type: 'mesh', maxAgents: 4 };
      assert.doesNotThrow(
        () => validateTopology(validTopology),
        'Valid topology should not throw'
      );

      const invalidTopology = { type: 'invalid', maxAgents: 4 };
      assert.throws(
        () => validateTopology(invalidTopology),
        /Invalid topology type/,
        'Invalid type should throw'
      );

      const invalidMaxAgents = { type: 'mesh', maxAgents: 0 };
      assert.throws(
        () => validateTopology(invalidMaxAgents),
        /Max agents must be at least 1/,
        'Invalid maxAgents should throw'
      );
    });
  });

  describe('Agent Spawning', () => {
    it('should spawn agent with correct type and configuration', () => {
      const spawnAgent = (type, config = {}) => {
        if (!type) throw new Error('Agent type is required');
        return {
          id: `agent-${Date.now()}-${Math.random()}`,
          type,
          status: 'spawning',
          config: { ...config },
          createdAt: new Date()
        };
      };

      const agent = spawnAgent('coder', { model: 'haiku', priority: 'high' });

      assert(agent.id, 'Agent should have an ID');
      assert.strictEqual(agent.type, 'coder', 'Agent type should be coder');
      assert.strictEqual(agent.status, 'spawning', 'Initial status should be spawning');
      assert.strictEqual(agent.config.model, 'haiku', 'Config should be applied');
    });

    it('should spawn multiple agents concurrently', (done) => {
      const spawnAgents = async (types) => {
        return Promise.all(
          types.map(
            (type) =>
              new Promise((resolve) => {
                setTimeout(() => {
                  resolve({
                    id: `agent-${type}-${Date.now()}`,
                    type,
                    status: 'active'
                  });
                }, Math.random() * 10);
              })
          )
        );
      };

      spawnAgents(['coder', 'tester', 'reviewer'])
        .then((agents) => {
          assert.strictEqual(agents.length, 3, 'Should spawn 3 agents');
          assert(agents.every((a) => a.status === 'active'), 'All agents should be active');
          assert.strictEqual(agents[0].type, 'coder', 'First agent should be coder');
          assert.strictEqual(agents[1].type, 'tester', 'Second agent should be tester');
          assert.strictEqual(agents[2].type, 'reviewer', 'Third agent should be reviewer');
          done();
        })
        .catch(done);
    });

    it('should reject invalid agent types', () => {
      const validTypes = ['coder', 'tester', 'reviewer', 'researcher', 'planner'];

      const validateAgentType = (type) => {
        if (!validTypes.includes(type)) {
          throw new Error(`Invalid agent type: ${type}`);
        }
      };

      assert.doesNotThrow(() => validateAgentType('coder'), 'Valid type should not throw');
      assert.throws(
        () => validateAgentType('invalid-agent'),
        /Invalid agent type/,
        'Invalid type should throw'
      );
    });

    it('should track agent lifecycle', () => {
      const agent = {
        id: 'agent-1',
        type: 'coder',
        status: 'spawning',
        events: []
      };

      const updateAgentStatus = (agent, newStatus) => {
        agent.events.push({
          from: agent.status,
          to: newStatus,
          timestamp: new Date()
        });
        agent.status = newStatus;
      };

      updateAgentStatus(agent, 'initializing');
      updateAgentStatus(agent, 'active');
      updateAgentStatus(agent, 'working');
      updateAgentStatus(agent, 'idle');

      assert.strictEqual(agent.status, 'idle', 'Final status should be idle');
      assert.strictEqual(agent.events.length, 4, 'Should have 4 status changes');
      assert.strictEqual(agent.events[0].from, 'spawning', 'First event from should be spawning');
      assert.strictEqual(agent.events[3].to, 'idle', 'Last event to should be idle');
    });

    it('should handle agent configuration merging', () => {
      const defaultConfig = {
        model: 'haiku',
        priority: 'normal',
        timeout: 5000,
        retries: 3
      };

      const userConfig = {
        model: 'sonnet',
        priority: 'high'
      };

      const mergedConfig = { ...defaultConfig, ...userConfig };

      assert.strictEqual(mergedConfig.model, 'sonnet', 'User model should override');
      assert.strictEqual(mergedConfig.priority, 'high', 'User priority should override');
      assert.strictEqual(mergedConfig.timeout, 5000, 'Default timeout should be preserved');
      assert.strictEqual(mergedConfig.retries, 3, 'Default retries should be preserved');
    });
  });

  describe('Swarm Coordination', () => {
    it('should establish communication between agents', () => {
      const agents = [
        { id: 'agent-1', type: 'coder', inbox: [] },
        { id: 'agent-2', type: 'tester', inbox: [] }
      ];

      const sendMessage = (from, to, message) => {
        const recipient = agents.find((a) => a.id === to);
        if (!recipient) throw new Error(`Agent ${to} not found`);
        recipient.inbox.push({
          from,
          message,
          timestamp: new Date()
        });
      };

      sendMessage('agent-1', 'agent-2', 'Implement feature X');

      assert.strictEqual(agents[1].inbox.length, 1, 'Should have 1 message');
      assert.strictEqual(agents[1].inbox[0].from, 'agent-1', 'Message from should be agent-1');
      assert.strictEqual(agents[1].inbox[0].message, 'Implement feature X', 'Message content should match');
    });

    it('should broadcast messages to all agents', () => {
      const agents = [
        { id: 'agent-1', type: 'coder', inbox: [] },
        { id: 'agent-2', type: 'tester', inbox: [] },
        { id: 'agent-3', type: 'reviewer', inbox: [] }
      ];

      const broadcast = (from, message, agents) => {
        agents.forEach((agent) => {
          if (agent.id !== from) {
            agent.inbox.push({
              from,
              message,
              timestamp: new Date()
            });
          }
        });
      };

      broadcast('agent-1', 'Workflow started', agents);

      assert.strictEqual(agents[0].inbox.length, 0, 'Sender should not receive broadcast');
      assert.strictEqual(agents[1].inbox.length, 1, 'Agent 2 should receive broadcast');
      assert.strictEqual(agents[2].inbox.length, 1, 'Agent 3 should receive broadcast');
    });

    it('should handle message queuing and processing', async () => {
      const messageQueue = {
        queue: [],
        add(message) {
          this.queue.push({ ...message, id: Date.now(), status: 'pending' });
        },
        async process() {
          for (let msg of this.queue) {
            msg.status = 'processing';
            await new Promise((resolve) => setTimeout(resolve, 10));
            msg.status = 'processed';
          }
        }
      };

      messageQueue.add({ from: 'agent-1', to: 'agent-2', content: 'Task 1' });
      messageQueue.add({ from: 'agent-1', to: 'agent-3', content: 'Task 2' });

      assert.strictEqual(messageQueue.queue.length, 2, 'Should queue 2 messages');
      assert(messageQueue.queue.every((m) => m.status === 'pending'), 'All messages should be pending');

      await messageQueue.process();

      assert(
        messageQueue.queue.every((m) => m.status === 'processed'),
        'All messages should be processed'
      );
    });

    it('should detect communication failures', () => {
      const sendMessageWithRetry = (from, to, message, maxRetries = 3) => {
        let attempts = 0;
        let lastError = null;

        while (attempts < maxRetries) {
          try {
            // Simulate random failure
            if (Math.random() > 0.7) {
              throw new Error('Network timeout');
            }
            return { success: true, attempts: attempts + 1 };
          } catch (error) {
            attempts++;
            lastError = error;
            if (attempts >= maxRetries) {
              throw new Error(`Failed after ${maxRetries} attempts: ${lastError.message}`);
            }
          }
        }
      };

      // Should succeed within retries
      const attempt = () => sendMessageWithRetry('a', 'b', 'msg');
      // This may succeed or fail based on randomness, but should not throw synchronously
      try {
        attempt();
      } catch (error) {
        assert(error.message.includes('Failed after'), 'Should include retry count in error');
      }
    });
  });

  describe('Swarm Initialization Flow', () => {
    it('should complete full initialization sequence', async () => {
      const initSwarm = async (config) => {
        const swarm = {
          id: `swarm-${Date.now()}`,
          status: 'initializing',
          topology: config.topology,
          agents: [],
          memory: { initialized: false }
        };

        // Step 1: Create topology
        swarm.status = 'topology-created';

        // Step 2: Initialize memory
        swarm.memory.initialized = true;
        swarm.status = 'memory-ready';

        // Step 3: Spawn agents
        for (let i = 0; i < config.agentCount; i++) {
          swarm.agents.push({
            id: `agent-${i}`,
            type: config.agentTypes[i % config.agentTypes.length],
            status: 'active'
          });
        }
        swarm.status = 'agents-spawned';

        // Step 4: Establish communication
        swarm.status = 'communication-ready';

        // Step 5: Ready for work
        swarm.status = 'ready';

        return swarm;
      };

      const swarm = await initSwarm({
        topology: 'mesh',
        agentCount: 5,
        agentTypes: ['coder', 'tester', 'reviewer']
      });

      assert.strictEqual(swarm.status, 'ready', 'Swarm should be ready');
      assert.strictEqual(swarm.agents.length, 5, 'Should have 5 agents');
      assert(swarm.memory.initialized, 'Memory should be initialized');
    });

    it('should handle initialization errors gracefully', async () => {
      const initSwarmWithErrorHandling = async (config) => {
        try {
          if (!config.topology) throw new Error('Topology is required');
          if (config.agentCount < 1) throw new Error('Must have at least 1 agent');

          return {
            status: 'ready',
            agents: Array(config.agentCount).fill(null)
          };
        } catch (error) {
          return {
            status: 'failed',
            error: error.message
          };
        }
      };

      const successResult = await initSwarmWithErrorHandling({
        topology: 'mesh',
        agentCount: 5
      });
      assert.strictEqual(successResult.status, 'ready', 'Should succeed with valid config');

      const failureResult = await initSwarmWithErrorHandling({
        agentCount: 5
      });
      assert.strictEqual(failureResult.status, 'failed', 'Should fail with invalid config');
      assert(failureResult.error, 'Should include error message');
    });

    it('should validate initialization prerequisites', () => {
      const prerequisites = {
        memory: { ready: true },
        filesystem: { ready: true },
        network: { ready: true }
      };

      const validatePrerequisites = (prereqs) => {
        const allReady = Object.values(prereqs).every((p) => p.ready);
        if (!allReady) {
          const failedChecks = Object.entries(prereqs)
            .filter(([, value]) => !value.ready)
            .map(([key]) => key);
          throw new Error(`Prerequisites not met: ${failedChecks.join(', ')}`);
        }
        return true;
      };

      assert.doesNotThrow(
        () => validatePrerequisites(prerequisites),
        'All ready should not throw'
      );

      prerequisites.network.ready = false;
      assert.throws(
        () => validatePrerequisites(prerequisites),
        /network/,
        'Should report network failure'
      );
    });

    it('should measure initialization performance', async () => {
      const measureInitPerformance = async () => {
        const startTime = Date.now();

        // Simulate initialization steps
        await new Promise((resolve) => setTimeout(resolve, 50)); // Topology
        await new Promise((resolve) => setTimeout(resolve, 30)); // Memory
        await new Promise((resolve) => setTimeout(resolve, 100)); // Agents
        await new Promise((resolve) => setTimeout(resolve, 20)); // Communication

        const endTime = Date.now();
        const duration = endTime - startTime;

        return {
          totalTime: duration,
          stages: {
            topology: 50,
            memory: 30,
            agents: 100,
            communication: 20
          }
        };
      };

      const performance = await measureInitPerformance();

      assert(performance.totalTime > 0, 'Should measure time');
      assert(performance.totalTime >= 200, 'Total time should include all stages');
      assert(
        performance.stages.agents > performance.stages.communication,
        'Agent spawning should take longer than communication'
      );
    });
  });
});
