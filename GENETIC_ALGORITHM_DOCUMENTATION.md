# Genetic Algorithm for Floor Plan Generation - Complete Documentation

## Table of Contents
1. [Overview](#overview)
2. [Gene Encoding & Representation](#gene-encoding--representation)
3. [Population Initialization](#population-initialization)
4. [Fitness Function](#fitness-function)
5. [Selection Strategy](#selection-strategy)
6. [Genetic Operators](#genetic-operators)
7. [Evolution Process](#evolution-process)
8. [Diversity Management](#diversity-management)
9. [Output Generation](#output-generation)
10. [Configurable Parameters](#configurable-parameters)

---

## Overview

This system uses a **Genetic Algorithm (GA)** to automatically generate optimal floor plans based on user requirements. The GA evolves a population of candidate floor plans over multiple generations, selecting and breeding the best designs to create layouts that satisfy room adjacency requirements, area allocations, and proportion constraints.

### Key Features
- **Binary Tree-based Representation**: Rooms are arranged using a binary space partitioning tree
- **Multi-objective Fitness**: Evaluates adjacency relationships, area percentages, and room proportions
- **Adaptive Crossover**: Multiple crossover strategies with automatic validation and repair
- **Diversity Management**: Generates 5 completely different layouts using diversity seeds
- **Configurable Parameters**: Customizable population size, mutation rate, and crossover rate

---

## Gene Encoding & Representation

### Gene Structure

Each individual (floor plan) is represented as a gene array:

```python
gene = [tree_index, permutation_index, split_axis_1, split_ratio_1, split_axis_2, split_ratio_2, ...]
```

**Components:**
1. **tree_index** (0 to num_trees-1): Selects which binary tree structure to use for room arrangement
2. **permutation_index** (0 to n!-1): Determines the order of rooms using factoradic number system
3. **split_axis_i** (0 or 1): Direction of split at each node (0 = horizontal, 1 = vertical)
4. **split_ratio_i** (0.0 to 1.0): How to divide space at each split point

### Binary Tree Representation

The algorithm generates all possible **Full Binary Trees (FBT)** with `2n-1` nodes (where n = number of rooms):
- **Leaf nodes**: Represent actual rooms
- **Internal nodes**: Represent split points in the floor plan

Example for 3 rooms (5 nodes total):
```
Tree Structure:
       Root
      /    \
   Room1   Split
          /    \
      Room2   Room3
```

### Factoradic Permutation System

The **factoradic number system** efficiently encodes all possible room orderings:
- Converts a single integer into a unique permutation of rooms
- Allows exploration of different room arrangements without storing all permutations
- For n rooms, supports n! different orderings

**Example:**
```python
# For 3 rooms: ["kitchen", "bedroom", "bathroom"]
permutation_index = 3 → factoradic [1,1,0] → order: ["bedroom", "bathroom", "kitchen"]
```

---

## Population Initialization

### Random Gene Generation

```python
def gen_population(PopSize, numOfRooms, maxTreeIndex):
    population = []
    for _ in range(PopSize):
        gene = []
        # 1. Random tree structure
        gene.append(random.randint(0, maxTreeIndex))
        
        # 2. Random room permutation
        maxPermutations = factorial(numOfRooms) - 1
        gene.append(random.randint(0, maxPermutations))
        
        # 3. Random splits (2*numOfRooms - 2 splits needed)
        for _ in range(2 * numOfRooms - 2):
            gene.append(random.randint(0, 1))  # axis
            gene.append(random.random())        # ratio
        
        population.append(gene)
    return population
```

### Initial Population Characteristics
- **Size**: Configurable (default: 20, range: 10-100)
- **Diversity**: Completely random initialization ensures wide exploration
- **Validity**: All genes are valid by construction

---

## Fitness Function

The fitness function evaluates how well a floor plan meets requirements using **three components**:

### 1. Adjacency Score (Weight: 50 points)

Checks if rooms specified as "connected" share a common wall:

```python
ADJACENCY_REWARD = 50

def checkAdjacency(connections, genLines):
    threshold = 50  # Minimum overlap length
    for connection in connections:
        room1, room2 = connection
        # Get wall lines for both rooms
        lines1 = [line for line in genLines if line[2] == room1]
        lines2 = [line for line in genLines if line[2] == room2]
        
        # Check if any walls are colinear (overlap)
        for line1 in lines1:
            for line2 in lines2:
                if has_overlap(line1, line2) >= threshold:
                    return True  # Adjacent!
    return False
```

**Scoring:**
- Each satisfied adjacency connection: +50 points
- Maximum adjacency score = 50 × number_of_connections

### 2. Area Percentage Score (Weight: 30 points)

Evaluates how closely room areas match the specified percentages:

```python
PERCENTAGE_REWARD = 30

def areaPercentageScore(rooms, target_percentages, total_area):
    score = 0
    for room in rooms:
        actual_area = room.width * room.height
        actual_percentage = (actual_area / total_area) * 100
        target_percentage = target_percentages[room.type]
        
        # Calculate error
        error = abs(actual_percentage - target_percentage)
        
        # Reward smaller errors more
        if error < 1:
            room_score = 30
        elif error < 3:
            room_score = 20
        elif error < 5:
            room_score = 10
        else:
            room_score = max(0, 10 - error)
        
        score += room_score
    
    return score
```

**Example Target Percentages:**
- Living Room: 25%
- Kitchen: 15%
- Bedroom: 15%
- Bathroom: 5%
- Car Porch: 10%

### 3. Room Proportion Score (Weight: 20 points)

Checks if rooms have appropriate width-to-height ratios:

```python
PROPORTION_REWARD = 20

def proportionScore(rooms, target_proportions):
    score = 0
    for room in rooms:
        actual_ratio = room.width / room.height
        target_ratio = target_proportions[room.type]
        
        # Check if ratio is within acceptable range (±30%)
        ratio_error = abs(actual_ratio - target_ratio) / target_ratio
        
        if ratio_error < 0.15:      # Within 15%
            score += 20
        elif ratio_error < 0.30:    # Within 30%
            score += 10
        elif ratio_error < 0.50:    # Within 50%
            score += 5
    
    return score
```

**Example Target Proportions:**
- Living Room: 0.8 (slightly rectangular)
- Kitchen: 0.7 (rectangular)
- Bedroom: 0.8
- Bathroom: 0.6 (more rectangular)
- Car Porch: 1.2 (horizontal)

### Total Fitness Calculation

```python
def fitness(gene, inputData, trees):
    # Generate floor plan from gene
    rooms = geneToFloorPlan(gene, inputData, trees)
    
    # Calculate each component
    adjacency_score = checkAdjacency(inputData["connections"], rooms) * ADJACENCY_REWARD
    area_score = areaPercentageScore(rooms, inputData["percents"], total_area)
    proportion_score = proportionScore(rooms, inputData["proportions"])
    
    total_fitness = adjacency_score + area_score + proportion_score
    
    return total_fitness
```

**Maximum Possible Score:**
- Max Adjacency: 50 × num_connections
- Max Area Score: 30 × num_rooms
- Max Proportion Score: 20 × num_rooms

---

## Selection Strategy

### Elite + Diversity Selection

The algorithm uses a **hybrid selection strategy** combining elitism and diversity:

```python
def selection(population, fitness_scores, num_selected):
    # Sort population by fitness
    sorted_pop = sorted(zip(population, fitness_scores), 
                       key=lambda x: x[1], reverse=True)
    
    # Elite Selection (70%)
    elite_size = int(num_selected * 0.7)
    elite = [gene for gene, _ in sorted_pop[:elite_size]]
    
    # Diversity Selection (30%)
    diverse_size = num_selected - elite_size
    # Select from different fitness ranges
    diverse = []
    step = len(sorted_pop) // diverse_size
    for i in range(diverse_size):
        idx = min(i * step, len(sorted_pop) - 1)
        diverse.append(sorted_pop[idx][0])
    
    return elite + diverse
```

**Benefits:**
- **Elitism**: Preserves best solutions across generations
- **Diversity**: Prevents premature convergence by maintaining variety

---

## Genetic Operators

### 1. Crossover (Recombination)

The algorithm implements **binary encoding crossover** with automatic validation:

#### Binary Encoding
```python
def encode_to_binary(gene):
    binary_string = ""
    
    # Encode tree index (10 bits)
    binary_string += format(gene[0], '010b')
    
    # Encode permutation index (20 bits)
    binary_string += format(gene[1], '020b')
    
    # Encode splits
    for i in range(2, len(gene), 2):
        axis = gene[i]
        ratio = gene[i+1]
        
        # Axis: 1 bit
        binary_string += str(axis)
        
        # Ratio: 8 bits (map 0.0-1.0 to 0-255)
        ratio_int = int(ratio * 255)
        binary_string += format(ratio_int, '08b')
    
    return binary_string
```

#### Single-Point Crossover
```python
def crossover(parent1, parent2, crossover_rate):
    if random.random() > crossover_rate:
        return parent1, parent2  # No crossover
    
    # Encode to binary
    bin1 = encode_to_binary(parent1)
    bin2 = encode_to_binary(parent2)
    
    # Random crossover point
    point = random.randint(1, len(bin1) - 1)
    
    # Swap segments
    child1_bin = bin1[:point] + bin2[point:]
    child2_bin = bin2[:point] + bin1[point:]
    
    # Decode back to genes
    child1 = decode_from_binary(child1_bin, len(parent1))
    child2 = decode_from_binary(child2_bin, len(parent2))
    
    # Validate and repair if necessary
    child1 = validate_and_repair(child1, max_tree_index, num_rooms)
    child2 = validate_and_repair(child2, max_tree_index, num_rooms)
    
    return child1, child2
```

#### Validation and Repair
```python
def validate_and_repair(gene, max_tree_index, num_rooms):
    # Fix tree index if out of bounds
    if gene[0] > max_tree_index:
        gene[0] = random.randint(0, max_tree_index)
    
    # Fix permutation index if out of bounds
    max_perm = factorial(num_rooms) - 1
    if gene[1] > max_perm:
        gene[1] = random.randint(0, max_perm)
    
    # Fix split ratios
    for i in range(3, len(gene), 2):
        if gene[i] < 0.0 or gene[i] > 1.0:
            gene[i] = random.random()
    
    return gene
```

### 2. Mutation (Random Variation)

**Bit-flip mutation** introduces random changes:

```python
def mutate(gene, mutation_rate, max_tree_index, num_rooms):
    mutated = gene.copy()
    
    # Mutate tree index
    if random.random() < mutation_rate:
        mutated[0] = random.randint(0, max_tree_index)
    
    # Mutate permutation
    if random.random() < mutation_rate:
        max_perm = factorial(num_rooms) - 1
        mutated[1] = random.randint(0, max_perm)
    
    # Mutate splits
    for i in range(2, len(mutated), 2):
        # Mutate axis
        if random.random() < mutation_rate:
            mutated[i] = 1 - mutated[i]  # Flip 0↔1
        
        # Mutate ratio
        if random.random() < mutation_rate:
            mutated[i+1] = random.random()
    
    return mutated
```

**Mutation Effects:**
- Changes tree structure → Different room arrangements
- Changes room order → Different room positions
- Changes split axes → Horizontal ↔ Vertical orientations
- Changes split ratios → Different room sizes

---

## Evolution Process

### Main GA Loop

```python
def GA(pop_size, generations, num_rooms, max_tree_index, inputData, trees, 
       mutation_rate=0.1, crossover_rate=0.7, diversity_seed=0):
    
    # Step 1: Initialize population
    population = gen_population(pop_size, num_rooms, max_tree_index)
    
    # Apply diversity seed for variation
    random.seed(diversity_seed)
    
    best_fitness_history = []
    
    # Evolution loop
    for generation in range(generations):
        # Step 2: Evaluate fitness
        fitness_scores = []
        for gene in population:
            score = fitness(gene, inputData, trees)
            fitness_scores.append(score)
        
        # Track best solution
        best_idx = fitness_scores.index(max(fitness_scores))
        best_gene = population[best_idx]
        best_score = fitness_scores[best_idx]
        best_fitness_history.append(best_score)
        
        print(f"Generation {generation}: Best Fitness = {best_score:.2f}")
        
        # Step 3: Selection
        selected = selection(population, fitness_scores, pop_size)
        
        # Step 4: Crossover
        offspring = []
        for i in range(0, len(selected), 2):
            if i + 1 < len(selected):
                child1, child2 = crossover(selected[i], selected[i+1], 
                                          crossover_rate)
                offspring.extend([child1, child2])
            else:
                offspring.append(selected[i])
        
        # Step 5: Mutation
        mutated = []
        for gene in offspring:
            mutated_gene = mutate(gene, mutation_rate, max_tree_index, num_rooms)
            mutated.append(mutated_gene)
        
        # Step 6: Replace population
        population = mutated
        
        # Elitism: Always keep best solution
        population[0] = best_gene
    
    # Return top 3 solutions
    final_scores = [fitness(gene, inputData, trees) for gene in population]
    sorted_pop = sorted(zip(population, final_scores), 
                       key=lambda x: x[1], reverse=True)
    
    return sorted_pop[:3]
```

### Evolution Stages

1. **Early Generations (0-20%)**:
   - High diversity, random exploration
   - Large fitness improvements
   - Population spreads across solution space

2. **Middle Generations (20-70%)**:
   - Convergence begins
   - Good solutions refined through crossover
   - Steady fitness improvements

3. **Late Generations (70-100%)**:
   - Fine-tuning phase
   - Small incremental improvements
   - Population converges to local optimum

---

## Diversity Management

### Multiple GA Runs with Diversity Seeds

To generate **completely different floor plans**, the system runs GA **5 times** with different diversity seeds:

```python
def GA_driver(parameters):
    # Run 1: Standard layout (seed=0)
    top1 = GA(pop_size, generations, num_rooms, max_tree_index, 
             inputData, trees, diversity_seed=0)
    
    # Run 2: High mutation emphasis (seed=1)
    top2 = GA(pop_size, generations, num_rooms, max_tree_index, 
             inputData, trees, diversity_seed=1)
    
    # Run 3: Extra variation (seed=2)
    top3 = GA(pop_size, generations, num_rooms, max_tree_index, 
             inputData, trees, diversity_seed=2)
    
    # Run 4: Maximum diversity (seed=3)
    top4 = GA(pop_size, generations, num_rooms, max_tree_index, 
             inputData, trees, diversity_seed=3)
    
    # Run 5: Alternative approach (seed=4)
    top5 = GA(pop_size, generations, num_rooms, max_tree_index, 
             inputData, trees, diversity_seed=4)
    
    # Generate JSON representations
    floor_plans = []
    for best_gene in [top1[0], top2[0], top3[0], top4[0], top5[0]]:
        json_plan = geneToJsonMap(inputData, best_gene[0], trees, rooms)
        floor_plans.append(json_plan)
    
    return floor_plans
```

**Why 5 Different Runs?**
- Different random seeds create different initial populations
- Each run explores different regions of solution space
- Provides users with variety: traditional layouts, modern designs, compact arrangements
- Increases chance of finding globally optimal solution

---

## Output Generation

### Gene to Floor Plan Conversion

The final step converts the best gene into a visual floor plan:

```python
def geneToJsonMap(inputData, gene, trees, room_list):
    # Step 1: Get tree structure
    tree_index = gene[0]
    tree = trees[tree_index]
    
    # Step 2: Get room order
    permutation_index = gene[1]
    room_order = factoradic_to_permutation(permutation_index, room_list)
    
    # Step 3: Build room coordinates
    width = inputData["width"]
    height = inputData["height"]
    root_node = TreeNode(0, 0, width, height, "root")
    
    # Recursively split space according to gene
    split_index = 2
    room_index = 0
    
    def split_node(node, depth):
        nonlocal split_index, room_index
        
        if node.isLeaf():
            # Assign room to leaf
            node.room_type = room_order[room_index]
            room_index += 1
            return
        
        # Get split parameters from gene
        split_axis = gene[split_index]       # 0=horizontal, 1=vertical
        split_ratio = gene[split_index + 1]  # 0.0 to 1.0
        split_index += 2
        
        # Perform split
        if split_axis == 0:  # Horizontal split
            split_y = node.y + (node.height * split_ratio)
            node.left = TreeNode(node.x, node.y, node.width, 
                                split_y - node.y, "left")
            node.right = TreeNode(node.x, split_y, node.width, 
                                 node.y + node.height - split_y, "right")
        else:  # Vertical split
            split_x = node.x + (node.width * split_ratio)
            node.left = TreeNode(node.x, node.y, 
                                split_x - node.x, node.height, "left")
            node.right = TreeNode(split_x, node.y, 
                                 node.x + node.width - split_x, 
                                 node.height, "right")
        
        # Recursively split children
        split_node(node.left, depth + 1)
        split_node(node.right, depth + 1)
    
    split_node(root_node, 0)
    
    # Step 4: Extract room coordinates
    rooms = []
    def collect_rooms(node):
        if node.isLeaf():
            rooms.append({
                "type": node.room_type,
                "x": node.x,
                "y": node.y,
                "width": node.width,
                "height": node.height
            })
        else:
            if node.left:
                collect_rooms(node.left)
            if node.right:
                collect_rooms(node.right)
    
    collect_rooms(root_node)
    
    # Step 5: Generate walls
    connections = []
    for room in rooms:
        # Add 4 walls per room
        connections.append({
            "x1": room["x"], "y1": room["y"],
            "x2": room["x"] + room["width"], "y2": room["y"],
            "type": "Wall"
        })
        # ... (add other 3 walls)
    
    # Step 6: Add doors based on adjacency requirements
    doors = []
    for connection in inputData["connections"]:
        room1, room2 = connection
        # Find shared wall
        shared_wall = find_shared_wall(rooms, room1, room2)
        if shared_wall:
            door = generateDoor(shared_wall)
            doors.append(door)
    
    # Step 7: Insert doors into wall structure
    final_connections = InsertDoorConnections(connections, doors)
    
    return {
        "rooms": rooms,
        "connections": final_connections,
        "fitness": fitness(gene, inputData, trees)
    }
```

### Door Placement

Doors are placed at the midpoint of shared walls:

```python
def generateDoor(wall_line):
    DOOR_LENGTH = 50  # Standard door width
    
    # Find wall midpoint
    if wall_line[0][0] == wall_line[1][0]:  # Vertical wall
        x = wall_line[0][0]
        midpoint_y = (wall_line[0][1] + wall_line[1][1]) / 2
        return [[x, midpoint_y + DOOR_LENGTH/2], 
                [x, midpoint_y - DOOR_LENGTH/2]]
    else:  # Horizontal wall
        y = wall_line[0][1]
        midpoint_x = (wall_line[0][0] + wall_line[1][0]) / 2
        return [[midpoint_x + DOOR_LENGTH/2, y], 
                [midpoint_x - DOOR_LENGTH/2, y]]
```

---

## Configurable Parameters

### User-Adjustable Parameters

| Parameter | Range | Default | Description |
|-----------|-------|---------|-------------|
| **Population Size** | 10-100 | 20 | Number of floor plans in each generation |
| **Mutation Rate** | 0.01-0.5 | 0.1 (10%) | Probability of random changes |
| **Crossover Rate** | 0.5-1.0 | 0.7 (70%) | Probability of combining two floor plans |
| **Max Generations** | 10-200 | 50 | Number of evolution iterations |

### Parameter Effects

#### Population Size
- **Small (10-20)**: Faster execution, less diversity, may miss good solutions
- **Medium (20-50)**: Balanced performance and quality
- **Large (50-100)**: More diversity, slower execution, better global search

#### Mutation Rate
- **Low (1-5%)**: Stable evolution, fine-tuning, risk of stagnation
- **Medium (10-20%)**: Good exploration, prevents premature convergence
- **High (30-50%)**: Maximum diversity, chaotic search, slower convergence

#### Crossover Rate
- **Low (50-60%)**: More independent mutations, less combination
- **Medium (70-80%)**: Good balance of mixing and preservation
- **High (90-100%)**: Strong inheritance, faster convergence

### Recommended Settings

**For Simple Layouts (3-4 rooms):**
```python
population_size = 20
mutation_rate = 0.1
crossover_rate = 0.7
generations = 30
```

**For Complex Layouts (5-7 rooms):**
```python
population_size = 50
mutation_rate = 0.15
crossover_rate = 0.8
generations = 50
```

**For Maximum Quality (slow):**
```python
population_size = 100
mutation_rate = 0.1
crossover_rate = 0.75
generations = 100
```

---

## Algorithm Complexity

### Time Complexity
- **Population Initialization**: O(P)
- **Fitness Evaluation**: O(P × R²) per generation (R = rooms, P = population)
- **Selection**: O(P log P)
- **Crossover**: O(P × G) (G = gene length)
- **Mutation**: O(P × G)
- **Total**: O(N × P × R²) where N = generations

### Space Complexity
- **Population Storage**: O(P × G)
- **Fitness Scores**: O(P)
- **Tree Structures**: O(T × R) where T = number of tree structures
- **Total**: O(P × G + T × R)

---

## Example Execution Flow

### Input:
```python
{
    "rooms": ["Kitchen", "Living Room", "Bedroom", "Bathroom"],
    "connections": [
        ["Kitchen", "Living Room"],
        ["Living Room", "Bedroom"],
        ["Bedroom", "Bathroom"]
    ],
    "percentages": {
        "Kitchen": 20,
        "Living Room": 35,
        "Bedroom": 30,
        "Bathroom": 15
    },
    "proportions": {
        "Kitchen": 0.8,
        "Living Room": 1.0,
        "Bedroom": 0.9,
        "Bathroom": 0.6
    },
    "width": 1000,
    "height": 800
}
```

### Execution:
```
🧬 Initializing Genetic Algorithm...
  Generated 14 possible tree structures
  Population size: 20
  Max generations: 50

🔄 Evolution Progress:
  Generation 0:  Best Fitness = 142.30
  Generation 10: Best Fitness = 198.50
  Generation 20: Best Fitness = 245.80
  Generation 30: Best Fitness = 267.20
  Generation 40: Best Fitness = 278.40
  Generation 50: Best Fitness = 282.10 ✓

🎨 Generating 5 diverse floor plan variations...
  ✓ Variation 1 complete (Standard layout)
  ✓ Variation 2 complete (High mutation)
  ✓ Variation 3 complete (Extra variation)
  ✓ Variation 4 complete (Maximum diversity)
  ✓ Variation 5 complete (Alternative approach)

✅ Generated 5 floor plans
```

### Output:
5 different floor plans with:
- Room coordinates and dimensions
- Wall connections
- Door placements
- Fitness scores

---

## Advantages of This Approach

1. **Automatic Design**: No manual room placement required
2. **Constraint Satisfaction**: Automatically respects adjacency, area, and proportion requirements
3. **Multiple Solutions**: Generates 5 different layouts for user choice
4. **Adaptable**: Works with any number of rooms and constraints
5. **Optimized**: Finds near-optimal solutions through intelligent search
6. **Configurable**: Users can adjust search parameters for speed vs quality

---

## Future Enhancements

Potential improvements to the genetic algorithm:

1. **Adaptive Parameters**: Automatically adjust mutation/crossover rates during evolution
2. **Multi-objective Optimization**: Use Pareto fronts for better trade-offs
3. **Local Search**: Hybrid GA with hill climbing for fine-tuning
4. **Machine Learning**: Use neural networks to predict good gene patterns
5. **User Feedback**: Learn from user selections to improve fitness function
6. **3D Constraints**: Add support for multi-story buildings
7. **Building Code Compliance**: Automatically enforce regulations

---

## Conclusion

This genetic algorithm provides a powerful, flexible system for automatic floor plan generation. By encoding floor plans as genes and evolving them through selection, crossover, and mutation, it discovers high-quality layouts that satisfy complex architectural constraints while providing diverse options for users to choose from.

The combination of binary tree representation, multi-objective fitness evaluation, and diversity management ensures that the generated floor plans are both functional and varied, giving users excellent starting points for their architectural designs.
