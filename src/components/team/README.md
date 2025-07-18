# Team Component Documentation

## Overview
The team page displays team members in a beautiful beehive pattern with hexagonal cards that flip on hover to reveal member information.

## Structure
- `TeamHive.tsx` - Main component that arranges team members in a beehive pattern
- `TeamMemberHex.tsx` - Individual hexagonal card component for each team member
- `page.tsx` - Team page layout with navbar and footer

## Adding/Updating Team Members

### 1. Update Team Data
Edit the `teamMembers` array in `src/components/team/TeamHive.tsx`:

```typescript
const teamMembers: TeamMember[] = [
  {
    id: 1,
    name: "Your Name",
    position: "Your Position",
    image: "/team/your-photo.jpg", // Place image in public/team/
    bio: "Optional bio text",
    email: "optional@email.com", // Optional
    linkedin: "https://linkedin.com/in/yourprofile", // Optional
    github: "https://github.com/yourusername" // Optional
  },
  // Add more members...
];
```

### 2. Add Team Photos
Place team member photos in the `public/team/` directory. Recommended image specs:
- Format: JPG or PNG
- Size: 300x300px minimum (square aspect ratio)
- File naming: descriptive names like `john-doe.jpg`

### 3. Layout Pattern
The beehive follows this pattern:
- Row 1: 3 hexagons (offset right)
- Row 2: 4 hexagons (centered)
- Row 3: 3 hexagons (offset right)

Currently displays 10 team members total. To add more rows, modify the JSX in `TeamHive.tsx`.

### 4. Customization Options
- Colors: Modify the gradient classes in `TeamMemberHex.tsx`
- Size: Adjust `w-36 h-36` classes to change hexagon size
- Animation: Modify `duration-700` to change flip speed
- Spacing: Adjust margin classes for tighter/looser spacing

## TypeScript Interface
Team member data structure is defined in `src/types/team.ts`:

```typescript
export interface TeamMember {
  id: number;
  name: string;
  position: string;
  image: string;
  bio?: string;
  email?: string;
  linkedin?: string;
  github?: string;
}
```

## Navigation
The team page is accessible via the navbar "Team" link, which navigates to `/team`.