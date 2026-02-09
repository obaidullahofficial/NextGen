import random
import math
import numpy as np
import numpy.random as npr

# Simple factoradic implementation since we don't have the library
def to_factoradic(n):
    """Convert number to factoradic representation"""
    if n == 0:
        return [0]
    
    result = []
    i = 1
    while n > 0:
        result.append(n % (i + 1))
        n //= (i + 1)
        i += 1
    
    return result

DOOR_LENGTH=50
ADJACENCY_REWARD=50
PERCENTAGE_REWARD=30
PROPORTION_REWARD=20

class TreeNode:
    def __init__(self, val=0, left=None, right=None):
         self.val = val
         self.left = left
         self.right = right

    def maketree(self,permutation,splitGenes):

        
        if(self.left==None):
            element=permutation.pop(0)
            self.val=element
        else:
            splitter=splitGenes.pop(0)
            self.val=[splitter[0],splitter[1]]

            self.left.maketree(permutation,splitGenes)

            self.right.maketree(permutation,splitGenes)
 
# Recursive function to clone a binary tree
def cloneBinaryTree(root):
 
    # base case
    if root is None:
        return None
 
    # create a new node with the same data as the root node
    root_copy = TreeNode(root.val)
 
    # clone the left and right subtree
    root_copy.left = cloneBinaryTree(root.left)
    root_copy.right = cloneBinaryTree(root.right)
 
    # return cloned root node
    return root_copy
 
def getString(node):
    x="{"+str(node.val)+","
    if(node.left!=None):
        x+=getString(node.left)
    else:
        x+="null"
    x+=","
    if(node.right!=None):
        x+=getString(node.right)
    else:
        x+="null"
    x+="}"
    return x



def allPossibleFBT(N):
    if N%2 == 0: return []
    if N==1: return [TreeNode(0)]
    res = []
    for i in range(1,N,2):#select number of the left substree nodes
        for l in allPossibleFBT(i):
            for r in allPossibleFBT(N-i-1):
                root=TreeNode(0)
                root.left=l
                root.right=r
                res.append(root)
    return res



def getNthPermutation(array,n):
    narr=array.copy()
    tarr=[]
    m=to_factoradic(n)
    m.reverse()
    lm=len(m)
    rem=abs(len(narr)-lm)
    for i in range(rem):
        m.insert(0,0)

    for i in m:
        if i < len(narr):
            tarr.append(narr.pop(i))
        else:
            tarr.append(narr.pop(0))

    return tarr




#
#   p0__________________p1
#   |                   |
#   |                   |
#   |___________________|
#   p2                  p3

def GenCoord(W,H):
    return [[0,0],[W,0],[0,H],[W,H],"Room"]

def splitRoom(coord,axis,ratio):
    if(ratio>1):
        ratio=0.5
    if(axis==1): #split on x axis
        dist=math.dist([coord[0][0]], [coord[1][0]])
        dist=dist*ratio
        newCoords=[]
        newCoords.append([coord[0],[coord[0][0]+dist,coord[1][1]],coord[2],[coord[2][0]+dist,coord[3][1]],coord[4]])
        newCoords.append([[coord[0][0]+dist,coord[1][1]],coord[1],[coord[2][0]+dist,coord[3][1]],coord[3],coord[4]])
        return newCoords
    else:
        dist=math.dist([coord[0][1]], [coord[2][1]])
        dist=dist*ratio
        newCoords=[]
        newCoords.append([coord[0],coord[1],[coord[0][0],coord[0][1]+dist],[coord[1][0],coord[1][1]+dist],coord[4]])
        newCoords.append([[coord[0][0],coord[0][1]+dist],[coord[1][0],coord[1][1]+dist],coord[2],coord[3],coord[4]])
        return newCoords

def GenerateRooms(coord,tree):
    if (tree.left==None):
        coord[4]=tree.val
        return [coord]
    rooms=[]
    splits=splitRoom(coord,tree.val[0],tree.val[1])
    rooms=rooms+GenerateRooms(splits[0],tree.left)
    rooms=rooms+GenerateRooms(splits[1],tree.right)
    return rooms
def roomsToLines(rooms):
    lines=[]
    for room in rooms:
        lines.append([room[0],room[1],room[4]])
        lines.append([room[0],room[2],room[4]])
        lines.append([room[1],room[3],room[4]])
        lines.append([room[2],room[3],room[4]])
        
    return lines

def check_colinear(set1, set2):
    x1, y1, x2, y2 = set1
    x3, y3, x4, y4 = set2
    if(x2 == x1 and x3 == x4):
        if(x1 == x3):
            line1_start = min(y1,y2)
            line1_end = max(y1,y2)
            line2_start = min(y3,y4)
            line2_end = max(y3,y4)
            overlap_start = max(line1_start, line2_start)
            overlap_end = min(line1_end, line2_end)
            overlap_distance = overlap_end - overlap_start

            return overlap_distance,"y"

    if(y2 == y1 and y3 == y4):
        if(y2 == y3):
            line1_start = min(x1, x2)
            line1_end = max(x1, x2)
            line2_start = min(x3, x4)
            line2_end = max(x3, x4)
            overlap_start = max(line1_start, line2_start)
            overlap_end = min(line1_end, line2_end)
            overlap_distance = overlap_end - overlap_start

            return overlap_distance,"x"

    return -1,'nil'

def checkIn(line,lineList):
    line1=line
    line2=[line[1],line[0]]
    if(line1 not in lineList and line2 not in lineList):
        return True
    return False


def NormalizeLines(lines):

    nlines=[]
    for line in lines:
        if(checkIn([line[0],line[1]],nlines)):
            nlines.append([line[0],line[1]])
    lines=nlines
    linesToremove=[]
    linesToadd=[]
    n=0
    while (True):

        for line in linesToremove:
            while(line in lines ):
                lines.remove(line)

            while([line[1],line[0]] in lines ):
                lines.remove([line[1],line[0]])

        lines=lines+linesToadd
        linesToremove=[]
        linesToadd=[]

        for i in range(len(lines)):
            for j in range(len(lines)):
                if(i!=j):
                    
                    line1=lines[i]
                    line2=lines[j]
                    x=check_colinear([line1[0][0],line1[0][1],line1[1][0],line1[1][1]],[line2[0][0],line2[0][1],line2[1][0],line2[1][1]])
                    if(x[0]>=0):
                        if(x[1]=="x"):
                            newline=[[max(line1[0][0],line1[1][0],line2[0][0],line2[1][0]),line1[1][1]],[min(line1[0][0],line1[1][0],line2[0][0],line2[1][0]),line2[1][1]]]
                        if(x[1]=="y"):
                            newline=[[line1[0][0],max(line1[0][1],line1[1][1],line2[0][1],line2[1][1])],[line1[0][0],min(line1[0][1],line1[1][1],line2[0][1],line2[1][1])]]
                        if(checkIn(newline,linesToadd)):
                            linesToadd.append(newline)
                        if(checkIn(line1,linesToremove)):
                            linesToremove.append(line1)
                        if(checkIn(line2,linesToremove)):
                            linesToremove.append(line2)

        if(len(linesToremove)==0 ):
            break



    return lines    

def linestoJson(lines):
    connections=[]
    for line in lines:
        connections.append({"x1":line[0][0],"y1":line[0][1],"x2":line[1][0],"y2":line[1][1],"type":"Wall"})
    return connections

def genTree(gene,Rooms,trees):
    tree=cloneBinaryTree(trees[gene[0]])
    perm=getNthPermutation(Rooms,gene[1])
    splitGenes=[]
    for i in range(len(Rooms)-1):
        splitGenes.append([gene[(i*2)+2],gene[(i*2)+3]])
    for splits in splitGenes:
        splits[1]=splits[1]/10
    tree.maketree(perm,splitGenes)
    return tree

def CheckAjdacent(room1,room2,threshold):
    lines=roomsToLines([room1,room2])
    for line1 in lines:
        for line2 in lines:
            if(line1[2]!= line2[2]):
                x=check_colinear([line1[0][0],line1[0][1],line1[1][0],line1[1][1]],[line2[0][0],line2[0][1],line2[1][0],line2[1][1]])
                if(x[0]>=threshold):
                    return True
    return False

def RoomtoDict(Rooms):
    rom={}
    for room in Rooms:
        rom[room[4]]=room
    return rom


def getRooms(dect):
    listA = []

    for i in dect:

        test = listA.count(i['from_tag'])
        if(test == 0):
            listA.append(i['from_tag'])
        test2 = listA.count(i['to_tag'])
        if(test2 == 0):
            listA.append(i['to_tag'])

    return listA

def getConnectionList(dect):
    conns=[]
    for connection in dect:
        con=[]
        con.append(connection['from_tag'])
        con.append(connection['from_tag'].split("-")[0])
        con.append(connection['to_tag'])
        con.append(connection['to_tag'].split("-")[0])
        conns.append(con)
    return conns

def getPercentageArea(w,h,cords):
    p1 = cords[0]
    p2 = cords[1]
    p3 = cords[2]
    p4 = cords[3]
    len1 = 0
    len2 = 0
    if p1[1] == p2[1]:
        len1 = math.sqrt((p1[0] - p2[0]) ** 2 + (p1[1] - p2[1]) ** 2)

    if(p1[0] == p2[0]):
        len2 = math.sqrt((p1[0] - p2[0]) ** 2 + (p1[1] - p2[1]) ** 2)

    if(p1[1] == p3[1]):
        len1 = math.sqrt((p1[0] - p3[0]) ** 2 + (p1[1] - p3[1]) ** 2)

    if(p1[0] == p3[0]):
        len2 = math.sqrt((p1[0] - p3[0]) ** 2 + (p1[1] - p3[1]) ** 2)

    if(p1[0] == p4[0]):
        len2 = math.sqrt((p1[0] - p4[0]) ** 2 + (p1[1] - p4[1]) ** 2)

    if(p1[1] == p4[1]):
        len1 = math.sqrt((p1[0] - p4[0]) ** 2 + (p1[1] - p4[1]) ** 2)

    smallarea = len1 * len2
    largeArea = w * h
    percentage = smallarea/largeArea * 100
    return percentage
def getProp(room):
    line1=[room[0],room[1]]
    line2=[room[0],room[2]]
    x1=math.dist (line1[0],line1[1])
    x2=math.dist (line2[0],line2[1])

    if(x1>=x2):
        return x2/x1
    else:
        return x1/x2
def fitness(inputG,gene,trees):
    score=0
    tree=genTree(gene,inputG["rooms"],trees)
    rooms=GenerateRooms(GenCoord(inputG["width"],inputG["height"]),tree)
    rooms_dict=RoomtoDict(rooms)
    for connection in inputG["connections"]:
        if(CheckAjdacent(rooms_dict[connection[0]],rooms_dict[connection[2]],DOOR_LENGTH)):
            score+=ADJACENCY_REWARD 

    for room in rooms:
        pArea=getPercentageArea(inputG["width"],inputG["height"],room)
        expected=inputG["percents"][room[4].split('-')[0]]

        deviation=abs((pArea-expected)/expected)
        if(deviation<=1):
            score+=(PERCENTAGE_REWARD*(1-deviation))      
    for room in rooms:
        propor=getProp(room)
        expected=inputG["proportions"][room[4].split('-')[0]]

        deviation=abs((propor-expected)/expected)
        if(deviation<=1):
            score+=(PROPORTION_REWARD*(1-deviation)) 

    return score



def validate_repair_gene(gene, Nr, cat):
  if (len(gene) < 4):
    #print("Gene length too small")
    return gene

  for i in range (len(gene)):
    if i == 0 and (gene[0] < 0 or gene[0] > cat):
      gene[0] = random.randint(0, cat)
    elif i == 1 and (gene[1] < 0 or gene[1] > math.factorial(Nr) - 1):
      gene[1] = random.randint(0, math.factorial(Nr) - 1)
    elif i > 1:
      if i % 2 == 0:
        if gene[i] != 0 and gene[i] != 1:
          gene[i] = random.randint(0, 1)
      else:
        if gene[i] < 1 or gene[i] > 9:
          gene[i] = random.randint(1, 9)

  return gene

def gen_population(N, Nr, cat):
  pop = []
  for i in range (N):
    chrom = []
    # Randomly choose tree structure for more diversity
    chrom.append(random.randint(0,cat))
    # Randomly choose room order
    chrom.append(random.randint(0, math.factorial(Nr) - 1) )
    # Generate diverse split ratios (1-9 range gives good variety)
    for j in range (Nr - 1):
      chrom.append(random.randint(0,1))  # Split direction (horizontal/vertical)
      # Use wider range for split ratios to create more diverse layouts
      split_ratio = random.choice([1,2,3,4,5,6,7,8,9])  # Equal probability for all ratios
      chrom.append(split_ratio)
    pop.append([chrom,None])
    
  return pop
def chromosomeToBin(chromosome,Nr,cat):
    chrom=""
    for i in range(len(chromosome)):
        glen=0
        if(i==0):
            glen=len(bin(cat)[2:])
        elif(i==1):
            glen=len(bin(math.factorial(Nr)-1)[2:])        
        elif(i%2==0):
            glen=1
        else:
            glen=len(bin(9)[2:])
        chrom=chrom+bin(chromosome[i])[2:].zfill(glen)
    return chrom

def binToChromosome(bins,Nr,cat):
    
    chrom=[]
    glen=len(bin(cat)[2:])
    chrom.append(int(bins[:glen],2))
    bins=bins[glen:]
    glen=len(bin(math.factorial(Nr)-1)[2:])
    chrom.append(int(bins[:glen],2))
    bins=bins[glen:]

    for i in range(Nr-1):
        glen=1
        chrom.append(int(bins[:glen],2))
        bins=bins[glen:]

        glen=len(bin(9)[2:])
        chrom.append(int(bins[:glen],2))
        bins=bins[glen:]
    return chrom

def crossover (chrom1, chrom2, Nr, cat):

    c1=chromosomeToBin(chrom1,Nr,cat)
    c2=chromosomeToBin(chrom2,Nr,cat)
    crossover_point = random.randint(1, len(c1)-1)
    offspring1 = c1[:crossover_point] + c2[crossover_point:]
    offspring2 = c2[:crossover_point] + c1[crossover_point:]
    offspring1=binToChromosome(offspring1,Nr,cat)
    offspring2=binToChromosome(offspring2,Nr,cat)

    offspring1 = validate_repair_gene(offspring1, Nr, cat)
    offspring2 = validate_repair_gene(offspring2, Nr, cat)


    return [offspring1,None], [offspring2,None]

def crossover2 (chrom1, chrom2, Nr, cat):

    crossover_point = random.randint(1, len(chrom1)-1)
    offspring1 = chrom1[:crossover_point] + chrom2[crossover_point:]
    offspring2 = chrom2[:crossover_point] + chrom1[crossover_point:]

    offspring1 = validate_repair_gene(offspring1, Nr, cat)
    offspring2 = validate_repair_gene(offspring2, Nr, cat)

    return [offspring1,None], [offspring2,None]



def replacebit(str1,ind,newbit):
    list1=list(str1)
    list1[ind]=newbit
    return "".join(list1)    
def mutate (chrom, Nr, cat):
    c1=chromosomeToBin(chrom,Nr,cat)
    mutation_point = random.randint(0, len(c1) - 1)
    if c1[mutation_point] == "0":
        c1=replacebit(c1,mutation_point,'1')
    else:
        c1=replacebit(c1,mutation_point,'0')
    c2=binToChromosome(c1,Nr,cat)
    c2=validate_repair_gene(c2, Nr, cat)

    return [c2,None]


def selectOne(self, population,fitnesses):
    max = sum([fitnesses[i] for i in range(len(population))])
    selection_probs = [fitnesses[i]/max for i in range(len(population))]
    return population[npr.choice(len(population), p=selection_probs)]

def selectOne(self, population):
    max = sum([c.fitness for c in population])
    selection_probs = [c.fitness/max for c in population]
    return npr.choice(len(population), p=selection_probs)
def checkDuplicate(chr,pop):
    for chrom in pop:
        match=True
        for i in range(len(chrom[0])):
            if(chrom[0][i]!=chr[0][i]):
                match=False
        if(match):
            return True
    return False

def GA(pop_size, generations_count, Nr, cat,inputG,trees, diversity_seed=0):
    #print("Population: ")
    # Use completely different random seeds for each variation to ensure diversity
    import time
    # Create truly unique seed using microseconds + diversity offset + process variations
    seed_value = int(time.time() * 1000000) + diversity_seed * 123456 + (diversity_seed ** 2) * 7890
    random.seed(seed_value)
    np.random.seed(seed_value % (2**32))  # NumPy seed must be < 2^32
    print(f"🎲 GA diversity_seed={diversity_seed}, seed={seed_value}")
    
    pop = gen_population(pop_size, Nr, cat)
    #print(pop)
    
    for i in range (generations_count):
        #print("Generation "+str(i+1)+":")
        noOfCrossover=int(len(pop)*0.5)
        # Increase mutation rate based on diversity seed to create more variation
        noOfMutations=int(len(pop)*(2.5 + diversity_seed * 0.5))
        for n in range(noOfCrossover):
            parent1 = random.choice(pop)
            parent2 = random.choice(pop)
            child1,child2=crossover(parent1[0], parent2[0], Nr, cat)
            if(not checkDuplicate(child1,pop)):
                pop.append(child1)
            if(not checkDuplicate(child2,pop)):
                pop.append(child2)

        for n in range(noOfCrossover):

            parent1 = random.choice(pop)
            parent2 = random.choice(pop)
            if(parent1!=parent2):
                child1,child2=crossover2(parent1[0], parent2[0], Nr, cat)
                if(not checkDuplicate(child1,pop)):
                    pop.append(child1)
                if(not checkDuplicate(child2,pop)):
                    pop.append(child2)


        for n in range(noOfMutations):
            parent = random.choice(pop)
            child=mutate(parent[0],Nr,cat)
            if(not checkDuplicate(child,pop)):
                pop.append(child)

        for j in range(len(pop)):
            if(pop[j][1]==None):
                pop[j][1]=fitness(inputG,pop[j][0],trees)
        
        
        # Sort the population in decreasing order of fitness score
        pop = sorted(pop, key = lambda x:x[1],reverse=True)
        
        # Keep top solutions but also maintain some diversity
        # Take top 70% by fitness, and random 30% for diversity
        top_count = int(pop_size * 0.7)
        diverse_count = pop_size - top_count
        
        # Keep best solutions
        survivors = pop[:top_count]
        
        # Add some random diverse solutions
        if len(pop) > pop_size:
            remaining = pop[top_count:]
            random.shuffle(remaining)
            survivors.extend(remaining[:diverse_count])
        else:
            # If not enough, just take what we have
            survivors.extend(pop[top_count:pop_size])
        
        pop = survivors[:pop_size]
        avgFitness=0
        for chrom in pop:
            avgFitness+=chrom[1]
        avgFitness=avgFitness/len(pop)
        #print("Fitness :"+str(avgFitness))

    # Return different solutions based on diversity_seed for more variety
    # Instead of always returning top 5, return from different ranks
    result = None
    if diversity_seed == 0:
        # Plan 1: Return a mix - best solution + some diverse ones
        result = [pop[0], pop[2], pop[4], pop[1], pop[3]]
    elif diversity_seed == 1:
        # Plan 2: Start from rank 1-5
        result = pop[1:6] if len(pop) >= 6 else pop[:5]
    elif diversity_seed == 2:
        # Plan 3: Start from rank 2-6
        result = pop[2:7] if len(pop) >= 7 else pop[:5]
    elif diversity_seed == 3:
        # Plan 4: Mix of top and middle ranks
        indices = [0, 3, 1, 4, 2]
        result = [pop[i] if i < len(pop) else pop[-1] for i in indices]
    else:
        # Plan 5: More diverse selection
        indices = [1, 4, 2, 5, 3] if len(pop) >= 6 else [0, 2, 1, 3, 4]
        result = [pop[i] if i < len(pop) else pop[-1] for i in indices]
    
    print(f"  📊 Returning solution with fitness: {result[0][1]:.2f} (from pop size {len(pop)})")
    return result

def getRoomCenters(rooms):
  room_centers = []
  for room in rooms:
    # Extract the coordinates for the opposite corners of the rectangle
    x1, y1 = room[0]
    x2, y2 = room[1]
    
    x3, y3 = room[2]
    x4, y4 = room[3]
    
    # Calculate the midpoint between the two corners
    center_x = ((x1 + x2) / 2) 
    center_y = (y1 + y3) / 2
    room_centers.append({'x' : center_x, 'y': center_y, 'type': 'label', 'label':room[4], 'x1': x1, 'y1': y1, 'x2': x2, 'y2': y2, 'x3': x3, 'y3': y3, 'x4': x4, 'y4': y4})
  return room_centers


def geneToJsonMap(inputG,gene,trees,Rooms):
    tree=genTree(gene,Rooms,trees)
    rooms=GenerateRooms(GenCoord(inputG["width"],inputG["height"]),tree)
    rooms_dict=RoomtoDict(rooms)
    doors=[]
    for connection in inputG["connections"]:
        adjacent=getAjdacentWall(rooms_dict[connection[0]],rooms_dict[connection[2]],DOOR_LENGTH)
        if(adjacent[0]):
            doors.append(generateDoor(adjacent[1]))
    lines=roomsToLines(rooms)
    nlines=NormalizeLines(lines.copy())
    jsonlines=linestoJson(nlines)
    jsonlines=InsertDoorConnections(jsonlines,doors)
    room_centers = getRoomCenters(rooms)
    for center in room_centers: 
        jsonlines.append(center)
    return jsonlines,rooms


def getAjdacentWall(room1,room2,threshold):
    lines=roomsToLines([room1,room2])
    for line1 in lines:
        for line2 in lines:
            if(line1[2]!= line2[2]):
                x=get_colinear([line1[0][0],line1[0][1],line1[1][0],line1[1][1]],[line2[0][0],line2[0][1],line2[1][0],line2[1][1]])
                if(x[0]>=threshold):
                    return True,[[x[1],x[2]],[x[3],x[4]]]
    return False,0
def get_colinear(set1, set2):
    x1, y1, x2, y2 = set1
    x3, y3, x4, y4 = set2
    if(x2 == x1 and x3 == x4):
        if(x1 == x3):
            line1_start = min(y1,y2)
            line1_end = max(y1,y2)
            line2_start = min(y3,y4)
            line2_end = max(y3,y4)
            overlap_start = max(line1_start, line2_start)
            overlap_end = min(line1_end, line2_end)
            overlap_distance = overlap_end - overlap_start

            return overlap_distance,x1,overlap_start,x1,overlap_end,"y"

    if(y2 == y1 and y3 == y4):
        if(y2 == y3):
            line1_start = min(x1, x2)
            line1_end = max(x1, x2)
            line2_start = min(x3, x4)
            line2_end = max(x3, x4)
            overlap_start = max(line1_start, line2_start)
            overlap_end = min(line1_end, line2_end)
            overlap_distance = overlap_end - overlap_start

            return overlap_distance,overlap_start,y1,overlap_end,y1,"x"

    return -1,-1
def generateDoor(line):
    doorLen=DOOR_LENGTH
    midpoint=0
    if(line[0][0]==line[1][0]):
        midpoint=(line[0][1]+line[1][1])/2
        return [[line[0][0],midpoint+doorLen/2],[line[0][0],midpoint-doorLen/2]]
    if(line[0][1]==line[1][1]):
        midpoint=(line[0][0]+line[1][0])/2
        return [[midpoint+doorLen/2,line[0][1]],[midpoint-doorLen/2,line[0][1]]]
    
def checkInclusion(connection,door):
    x1=connection["x1"]
    y1=connection["y1"]
    x2=connection["x2"]
    y2=connection["y2"]

    x=check_colinear([x1,y1,x2,y2],[door[0][0],door[0][1],door[1][0],door[1][1]])
    
    
    if(x[0]>0):
        if(x[1]=='y'):
            if(x[0]>=abs(door[0][1]-door[1][1])):
                line1=[[x1,min(y1,y2)],[x1,min(door[0][1],door[1][1])] ]
                line2=[[x1,min(door[0][1],door[1][1])],[x1,max(door[0][1],door[1][1])] ]
                line3=[[x1,max(door[0][1],door[1][1])],[x1,max(y1,y2)] ]
                return True,line1,line2,line3
        elif(x[1]=='x'):
            if(x[0]>=abs(door[0][0]-door[1][0])):
                line1=[[min(x1,x2),y1],[min(door[0][0],door[1][0]),y1] ]
                line2=[[min(door[0][0],door[1][0]),y1],[max(door[0][0],door[1][0]),y1] ]
                line3=[[max(door[0][0],door[1][0]),y1],[max(x1,x2),y1] ]

                return True,line1,line2,line3
    return [False]        
def InsertDoorConnections(connections,doors):
    for door in doors:
        added=False
        newLines=[]
        connectionR=[]
        for connection in connections:
            if(not added):
                x=checkInclusion(connection,door)
                if(x[0]):
                    added=True
                    newLines=[x[1],x[2],x[3]]
                    connectionR=connection
        if connectionR:  # Only remove if we found a connection to replace
            connections.remove(connectionR)
            connections.append({"x1":newLines[0][0][0],"y1":newLines[0][0][1],"x2":newLines[0][1][0],"y2":newLines[0][1][1],"type":"Wall"})
            connections.append({"x1":newLines[1][0][0],"y1":newLines[1][0][1],"x2":newLines[1][1][0],"y2":newLines[1][1][1],"type":"Door"})
            connections.append({"x1":newLines[2][0][0],"y1":newLines[2][0][1],"x2":newLines[2][1][0],"y2":newLines[2][1][1],"type":"Wall"})
    return connections

def GA_driver(connects=None, width=1000, height=1000, kitchen_p=0.7, living_p=0.8, drawing_p=0.8, car_p=1.2, bath_p=0.6, bed_p=0.8, gar_p=1.0, kitchen_per=15, living_per=25, drawing_per=20, car_per=10, bath_per=5, bed_per=15, gar_per=10, room_tags=None, max_generations=50, population_size=20, mutation_rate=0.1, crossover_rate=0.7):
    try:
        # Input validation
        if not connects or len(connects) == 0:
            return {"error": "No room connections provided", "maps": [], "room": []}
        
        if width <= 0 or height <= 0:
            return {"error": "Invalid plot dimensions", "maps": [], "room": []}

        Roms=getRooms(connects)
        conns=getConnectionList(connects)
        
        # Validate extracted data
        if not Roms or len(Roms) == 0:
            return {"error": "No valid rooms found", "maps": [], "room": []}
            
        print(f"Processing {len(Roms)} rooms: {Roms}")
        print(f"Processing {len(conns)} connections")
        
        inputG={
        "width":width,
        "height":height,
        "connections":conns,
        "rooms":Roms,
        "percents":{
            "livingroom":float(living_per),
            "kitchen":float(kitchen_per),
            "bedroom":float(bed_per),
            "bathroom":float(bath_per),
            "carporch":float(car_per),
            "garden":float(gar_per),
            "drawingroom":float(drawing_per)
        },
        "proportions":{
            "livingroom":float(living_p),
            "kitchen":float(kitchen_p),
            "bedroom":float(bed_p),
            "bathroom":float(bath_p),
            "carporch":float(car_p),
            "garden":float(gar_p),
            "drawingroom":float(drawing_p)
        }
        }
        
        # Generate all possible binary trees
        tree_nodes = 2 * len(Roms) - 1
        if tree_nodes <= 0:
            return {"error": "Invalid number of rooms for tree generation", "maps": [], "room": []}
            
        alltree=allPossibleFBT(tree_nodes) #2l-1
        print(f"Generated {len(alltree)} possible tree structures")
        
        if len(alltree) == 0:
            return {"error": "No valid tree structures generated", "maps": [], "room": []}

        # Use provided GA parameters
        generations = max_generations  # Use parameter
        pop_size = min(population_size, 10)  # Limit to avoid performance issues
        
        # Run GA 5 times with different diversity seeds for completely different layouts
        print("🎨 Generating 5 diverse floor plan variations...")
        top1=GA(pop_size, generations, len(Roms), len(alltree)-1,inputG,alltree, diversity_seed=0)
        print(f"  ✓ Variation 1 complete (Standard layout)")
        top2=GA(pop_size, generations, len(Roms), len(alltree)-1,inputG,alltree, diversity_seed=1)
        print(f"  ✓ Variation 2 complete (High mutation)")
        top3=GA(pop_size, generations, len(Roms), len(alltree)-1,inputG,alltree, diversity_seed=2)
        print(f"  ✓ Variation 3 complete (Extra variation)")
        top4=GA(pop_size, generations, len(Roms), len(alltree)-1,inputG,alltree, diversity_seed=3)
        print(f"  ✓ Variation 4 complete (Maximum diversity)")
        top5=GA(pop_size, generations, len(Roms), len(alltree)-1,inputG,alltree, diversity_seed=4)
        print(f"  ✓ Variation 5 complete (Alternative approach)")

        jsonn = []
        rooms=[]
        
        # Generate floor plans from GA results
        if top1 and len(top1) > 0:
            jsn,rm=geneToJsonMap(inputG,top1[0][0],alltree,Roms)
            jsonn.append(jsn)
            rooms.append(rm)
        
        if top2 and len(top2) > 0:
            jsn,rm=geneToJsonMap(inputG,top2[0][0],alltree,Roms)
            jsonn.append(jsn)
            rooms.append(rm)
        
        if top3 and len(top3) > 0:
            jsn,rm=geneToJsonMap(inputG,top3[0][0],alltree,Roms)
            jsonn.append(jsn)
            rooms.append(rm)
        
        if top4 and len(top4) > 0:
            jsn,rm=geneToJsonMap(inputG,top4[0][0],alltree,Roms)
            jsonn.append(jsn)
            rooms.append(rm)
        
        if top5 and len(top5) > 0:
            jsn,rm=geneToJsonMap(inputG,top5[0][0],alltree,Roms)
            jsonn.append(jsn)
            rooms.append(rm)
        
        print(f"Generated {len(jsonn)} floor plans")
        
        if not jsonn:
            return {"error": "Failed to generate valid floor plans", "maps": [], "room": []}
            
        return {"maps":jsonn ,"room":rooms}
        
    except Exception as e:
        print(f"Error in GA_driver: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"error": str(e), "maps": [], "room": []}

