from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional
import heapq
import re

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# === Campus Graph Definition ===
graph: Dict[str, List[tuple]] = {}

def add_edge(frm: str, to: str, dist: float):
    if frm not in graph:
        graph[frm] = []
    if to not in graph:
        graph[to] = []
    graph[frm].append((to, dist))
    graph[to].append((frm, dist))  # bidirectional

# --- Ground Floor ---
add_edge("Entry/Exit North", "6-Lift Area G", 20)
add_edge("Entry/Exit South", "Enquiry Dept", 15)
add_edge("6-Lift Area G", "Exam Dept", 10)
add_edge("6-Lift Area G", "Enquiry Dept", 8)
add_edge("6-Lift Area G", "Classrooms C001-C009", 25)
add_edge("Classrooms C001-C009", "3-Lift Area G", 18)
add_edge("3-Lift Area G", "Classroom C010", 7)
add_edge("Classroom C010", "Moot Court", 12)
add_edge("Moot Court", "Canteen", 20)

# --- First Floor ---
add_edge("Entry/Exit First", "6-Lift Area 1", 22)
add_edge("6-Lift Area 1", "Labs L101-L108", 30)
add_edge("6-Lift Area 1", "Meeting Room 2", 15)
add_edge("Meeting Room 2", "Admin Office", 8)
add_edge("Admin Office", "Head Faculty Office", 6)
add_edge("Head Faculty Office", "Faculty Area 1", 10)
add_edge("Faculty Area 1", "Labs L109-L110", 15)
add_edge("L110", "Classroom C101", 7)
add_edge("Classroom C101", "Seminar Room", 10)
add_edge("Seminar Room", "Lab L111", 8)
add_edge("Lab L111", "Library Area", 25)

# --- Second Floor ---
add_edge("6-Lift Area 2", "Labs L201-L208", 35)
add_edge("6-Lift Area 2", "BI Labs L209-L210", 12)
add_edge("6-Lift Area 2", "Classrooms C201-C212", 28)
add_edge("L208", "Boys Common Room", 10)
add_edge("Boys Common Room", "Girls Common Room", 7)
add_edge("Girls Common Room", "3-Lift Area 2", 15)

# --- Third Floor ---
add_edge("6-Lift Area 3", "Auditorium", 20)
add_edge("6-Lift Area 3", "Faculty Area 3", 15)
add_edge("Faculty Area 3", "Tutorial Rooms", 25)
add_edge("Tutorial Rooms", "C301-C306", 18)
add_edge("C306", "Music Room", 10)
add_edge("Music Room", "Sports Room", 8)
add_edge("Sports Room", "3-Lift Area 3", 12)

# --- Inter-floor Lifts ---
lift_pairs = [
    ("6-Lift Area G", "6-Lift Area 1"),
    ("6-Lift Area 1", "6-Lift Area 2"),
    ("6-Lift Area 2", "6-Lift Area 3"),
    ("3-Lift Area G", "3-Lift Area 1"),
    ("3-Lift Area 1", "3-Lift Area 2"),
    ("3-Lift Area 2", "3-Lift Area 3"),
]

for up, down in lift_pairs:
    add_edge(up, down, 30)  # 30m equivalent for lift time

# === Node Coordinates (Percent-based) ===
node_coords = {
    # Ground Floor
    "Entry/Exit North": {"floor": "ground", "x": 50, "y": 95},
    "6-Lift Area G": {"floor": "ground", "x": 70, "y": 70},
    "3-Lift Area G": {"floor": "ground", "x": 30, "y": 70},
    "Classroom C010": {"floor": "ground", "x": 25, "y": 50},
    "Canteen": {"floor": "ground", "x": 40, "y": 30},
    "Moot Court": {"floor": "ground", "x": 20, "y": 40},
    "Exam Dept": {"floor": "ground", "x": 85, "y": 60},
    "Enquiry Dept": {"floor": "ground", "x": 80, "y": 80},

    # First Floor
    "6-Lift Area 1": {"floor": "first", "x": 70, "y": 70},
    "3-Lift Area 1": {"floor": "first", "x": 30, "y": 70},
    "Classroom C101": {"floor": "first", "x": 25, "y": 50},
    "Labs L101-L108": {"floor": "first", "x": 75, "y": 50},
    "Library Area": {"floor": "first", "x": 40, "y": 20},
    "Seminar Room": {"floor": "first", "x": 30, "y": 30},
    "Admin Office": {"floor": "first", "x": 60, "y": 60},
    "Head Faculty Office": {"floor": "first", "x": 55, "y": 55},
    "Faculty Area 1": {"floor": "first", "x": 50, "y": 50},
    "Meeting Room 2": {"floor": "first", "x": 65, "y": 65},

    # Second Floor
    "6-Lift Area 2": {"floor": "second", "x": 70, "y": 70},
    "3-Lift Area 2": {"floor": "second", "x": 30, "y": 70},
    "Labs L201-L208": {"floor": "second", "x": 75, "y": 50},
    "BI Labs L209-L210": {"floor": "second", "x": 60, "y": 40},
    "Classrooms C201-C212": {"floor": "second", "x": 40, "y": 60},
    "Boys Common Room": {"floor": "second", "x": 25, "y": 40},
    "Girls Common Room": {"floor": "second", "x": 20, "y": 30},

    # Third Floor
    "6-Lift Area 3": {"floor": "third", "x": 70, "y": 70},
    "3-Lift Area 3": {"floor": "third", "x": 30, "y": 70},
    "Auditorium": {"floor": "third", "x": 70, "y": 40},
    "Tutorial Rooms": {"floor": "third", "x": 60, "y": 50},
    "C301-C306": {"floor": "third", "x": 50, "y": 30},
}

# === Room Mapping Logic ===
def resolve_room(room_query: str) -> Optional[str]:
    """
    Try to resolve a room code (e.g. C005, L103) to its parent group node.
    Returns closest match or None.
    """
    room_query = room_query.strip().upper()
    
    # Direct match
    if room_query in graph:
        return room_query

    # Pattern: Match room codes like C005, L103, etc.
    match = re.match(r"^([A-Za-z]+)(\d+)$", room_query)
    if not match:
        return None

    prefix, num_str = match.groups()
    num = int(num_str)

    # Define room ranges
    ranges = [
        ("C", 1, 9, "Classrooms C001-C009"),
        ("C", 10, 10, "Classroom C010"),
        ("C", 101, 101, "Classroom C101"),
        ("C", 201, 212, "Classrooms C201-C212"),
        ("C", 301, 306, "C301-C306"),
        ("L", 101, 108, "Labs L101-L108"),
        ("L", 109, 110, "Labs L109-L110"),
        ("L", 111, 111, "Lab L111"),
        ("L", 201, 208, "Labs L201-L208"),
        ("L", 209, 210, "BI Labs L209-L210"),
    ]

    for p, low, high, node_name in ranges:
        if prefix.upper() == p.upper() and low <= num <= high:
            return node_name

    return None

# === Dijkstra Algorithm ===
class PriorityQueue:
    def __init__(self):
        self.heap = []
    def push(self, item, priority):
        heapq.heappush(self.heap, (priority, item))
    def pop(self):
        return heapq.heappop(self.heap)[1]
    def empty(self):
        return len(self.heap) == 0

def dijkstra(start: str, end: str) -> Optional[List[str]]:
    if start not in graph or end not in graph:
        return None
    frontier = PriorityQueue()
    frontier.push(start, 0)
    came_from = {start: None}
    cost_so_far = {start: 0}

    while not frontier.empty():
        current = frontier.pop()
        if current == end:
            break
        for neighbor, weight in graph[current]:
            new_cost = cost_so_far[current] + weight
            if neighbor not in cost_so_far or new_cost < cost_so_far[neighbor]:
                cost_so_far[neighbor] = new_cost
                priority = new_cost
                frontier.push(neighbor, priority)
                came_from[neighbor] = current

    # Reconstruct path
    path = []
    step = end
    while step is not None:
        path.append(step)
        step = came_from.get(step)
    path.reverse()
    return path if path[0] == start else None

# === API Model ===
class RouteRequest(BaseModel):
    start: str
    end: str

class RouteResponse(BaseModel):
    path: List[str]
    coordinates: List[dict]
    total_distance: float  # Add total distance

@app.post("/route", response_model=RouteResponse)
async def get_route(request: RouteRequest):
    start_raw = request.start.strip()
    end_raw = request.end.strip()

    # Resolve start point
    start_node = resolve_room(start_raw)
    if not start_node:
        start_node = next((n for n in graph.keys() if start_raw.lower() in n.lower()), None)
    if not start_node:
        raise HTTPException(status_code=404, detail=f"Start location '{start_raw}' not found.")

    # Resolve end point
    end_node = resolve_room(end_raw)
    if not end_node:
        end_node = next((n for n in graph.keys() if end_raw.lower() in n.lower()), None)
    if not end_node:
        raise HTTPException(status_code=404, detail=f"End location '{end_raw}' not found.")

    # Find shortest path
    path = dijkstra(start_node, end_node)
    if not path:
        raise HTTPException(status_code=404, detail="No path found between locations.")

    # Calculate total distance
    total_distance = 0.0
    for i in range(len(path) - 1):
        u, v = path[i], path[i+1]
        for neighbor, weight in graph[u]:
            if neighbor == v:
                total_distance += weight
                break

    # Generate coordinates
    coords = []
    for node in path:
        coord = node_coords.get(node)
        if coord:
            coords.append({**coord, "node": node})
        else:
            # Infer floor from name
            inferred_floor = "ground"
            if "first" in node.lower(): inferred_floor = "first"
            elif "second" in node.lower(): inferred_floor = "second"
            elif "third" in node.lower(): inferred_floor = "third"
            # Approximate position based on area
            base_x, base_y = 50, 50
            if "lift" in node.lower():
                base_x = 70 if "6-" in node else 30
                base_y = 70
            elif "class" in node.lower():
                base_x, base_y = 25, 50
            elif "lab" in node.lower():
                base_x, base_y = 75, 50
            elif "auditorium" in node.lower():
                base_x, base_y = 70, 40

            coords.append({
                "node": node,
                "floor": inferred_floor,
                "x": base_x,
                "y": base_y
            })

    return {
        "path": path,
        "coordinates": coords,
        "total_distance": round(total_distance, 2)
    }