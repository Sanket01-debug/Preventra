// src/app/dashboard/page.jsx

"use client";

import React, { useState, useEffect } from 'react'; // Removed useCallback as it wasn't strictly needed here
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from "@/lib/utils";
import {
    ArrowLeft,
    ListChecks,
    CheckCircle2,
    Circle,
    Sparkles,
    Droplet,
    Footprints as StepsIcon,
    Moon,
    Activity,
    Heart,
    Settings as Lungs, // Make sure this alias is used if needed or remove
    Loader2,
    GlassWater,
    Utensils,
    Minus,
    Plus
} from 'lucide-react';

// --- General Wellness Tips Data ---
const generalMeasures = [
    { id: 'gen1', icon: Droplet, text: "Stay Hydrated: Aim for 8 glasses of water throughout the day.", color: "text-cyan-600 dark:text-cyan-400" },
    { id: 'gen2', icon: StepsIcon, text: "Move Your Body: Target at least 30 minutes of moderate activity most days.", color: "text-indigo-600 dark:text-indigo-400" },
    { id: 'gen3', icon: Moon, text: "Prioritize Sleep: Aim for 7-9 hours of quality sleep per night.", color: "text-yellow-600 dark:text-yellow-400" },
    { id: 'gen4', icon: Activity, text: "Manage Stress: Incorporate relaxation techniques like deep breathing or meditation.", color: "text-pink-600 dark:text-pink-400" },
    { id: 'gen5', icon: Heart, text: "Eat Balanced Meals: Focus on fruits, vegetables, whole grains, and lean protein.", color: "text-green-600 dark:text-green-400" },
];

// --- Dashboard Page Component ---
export default function DashboardPage() {
    const router = useRouter();
    const [tasks, setTasks] = useState([]); // Stores personalized tasks from localStorage
    const [isLoading, setIsLoading] = useState(true); // Tracks if localStorage is being checked

    // --- State for Initial Interactive Widgets ---
    const [waterIntake, setWaterIntake] = useState(0); // Tracks glasses of water
    const waterGoal = 8; // Daily water goal
    const [mealsLogged, setMealsLogged] = useState({ breakfast: false, lunch: false, dinner: false }); // Tracks logged meals

    // --- Load Personalized Tasks from localStorage on Mount ---
    useEffect(() => {
        console.log("Dashboard: Mounting and loading tasks.");
        setIsLoading(true);
        try {
            const storedTasks = localStorage.getItem('healthTasks');
            if (storedTasks) {
                const parsedTasks = JSON.parse(storedTasks);
                if (Array.isArray(parsedTasks)) {
                    setTasks(parsedTasks);
                    console.log(`Dashboard: Loaded ${parsedTasks.length} personalized task(s).`);
                } else {
                    console.warn("Dashboard: Stored 'healthTasks' is not an array.");
                    setTasks([]);
                    localStorage.removeItem('healthTasks'); // Clean up invalid data
                }
            } else {
                setTasks([]); // Set empty if nothing in storage
                console.log("Dashboard: No personalized tasks found in localStorage.");
            }
        } catch (error) {
            console.error("Dashboard: Error loading/parsing tasks from localStorage:", error);
            setTasks([]); // Set empty on error
        } finally {
            setTimeout(() => setIsLoading(false), 300);
        }
    }, []); // Empty dependency array ensures this runs only once on mount

    // --- Event Handlers for Initial Widgets ---
    const handleWaterChange = (amount) => {
        setWaterIntake(prev => Math.max(0, Math.min(12, prev + amount))); // Limit 0-12 glasses
    };

    const toggleMealLogged = (meal) => {
        setMealsLogged(prev => ({ ...prev, [meal]: !prev[meal] }));
    };

    // --- Render Functions ---

    // Renders a single personalized task item
    const renderTaskItem = (task) => (
        <div key={task.id} className={cn(
            "flex items-center p-3 rounded-md border mb-2 transition-all duration-300",
            task.isCompleted ? 'bg-muted/40 dark:bg-muted/30 opacity-60' : 'bg-card hover:bg-muted/30 dark:hover:bg-muted/20'
        )}>
            {task.isCompleted
                ? <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                : <Circle className="h-5 w-5 text-muted-foreground mr-3 flex-shrink-0" />
            }
            <span className={cn(
                "flex-1 text-sm",
                task.isCompleted ? 'line-through text-muted-foreground' : ''
            )}>
                {task.description}
                 {task.source && task.source !== 'Manual' && (
                     <span className="ml-2 text-xs text-muted-foreground/80">({task.source.replace('Sensor: ', '').replace('User Input', 'Input').replace('AI Analysis', 'AI')})</span>
                 )}
            </span>
        </div>
    );

    // Renders a single general wellness tip
    const renderGeneralMeasure = (measure) => (
        <div key={measure.id} className="flex items-start p-3 rounded-md border border-dashed border-border/50 mb-2 bg-card/50 dark:bg-background/20">
            <measure.icon className={cn("h-5 w-5 mr-3 mt-0.5 flex-shrink-0", measure.color)} />
            <span className="flex-1 text-sm text-muted-foreground">{measure.text}</span>
        </div>
    );

    // Renders the initial interactive widgets (Water, Meals)
    const renderInitialWidgets = () => (
         <div className={cn(
            "grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 mb-8 transition-opacity duration-500 ease-out",
            // Let the main content handle loading state visibility
         )}>
            {/* Water Intake Card */}
            <Card className="bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-blue-900/30 dark:via-background dark:to-cyan-900/30 shadow-sm border-blue-100 dark:border-blue-900/50">
                 <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold flex items-center text-blue-800 dark:text-blue-300">
                        <GlassWater className="mr-2 h-5 w-5"/>Today's Hydration
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center space-y-3 pt-2">
                    <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">{waterIntake} <span className="text-lg font-normal text-muted-foreground">/ {waterGoal} glasses</span></div>
                    <Progress value={(waterIntake / waterGoal) * 100} className="w-full h-2 bg-blue-100 dark:bg-blue-900 [&>*]:bg-gradient-to-r [&>*]:from-blue-400 [&>*]:to-cyan-400" />
                    <div className="flex space-x-3 pt-1">
                        <Button variant="outline" size="icon" onClick={() => handleWaterChange(-1)} disabled={waterIntake <= 0} aria-label="Decrease water intake"> <Minus className="h-4 w-4" /> </Button>
                        <Button variant="outline" size="icon" onClick={() => handleWaterChange(1)} disabled={waterIntake >= 12} aria-label="Increase water intake"> <Plus className="h-4 w-4" /> </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Meal Logging Card */}
            <Card className="bg-gradient-to-br from-orange-50 via-white to-yellow-50 dark:from-orange-900/30 dark:via-background dark:to-yellow-900/30 shadow-sm border-orange-100 dark:border-orange-900/50">
                 <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold flex items-center text-orange-800 dark:text-orange-300">
                        <Utensils className="mr-2 h-5 w-5" />Log Your Meals
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex justify-around items-center pt-4 pb-4">
                     {['breakfast', 'lunch', 'dinner'].map(meal => (
                        <Button
                            key={meal}
                            variant={mealsLogged[meal] ? "secondary" : "outline"}
                            size="sm"
                            onClick={() => toggleMealLogged(meal)}
                            className={cn(
                                "capitalize transition-all w-24", // Fixed width
                                mealsLogged[meal]
                                    // Styling for logged state (using secondary variant's look)
                                    ? 'bg-orange-100 text-orange-700 border-orange-300 hover:bg-orange-200 dark:bg-orange-900/70 dark:text-orange-300 dark:border-orange-700 dark:hover:bg-orange-800'
                                    // Styling for not-logged state (using outline variant's look)
                                    : 'text-muted-foreground border-input hover:bg-accent hover:text-accent-foreground'
                            )}
                        >
                            {mealsLogged[meal] && <CheckCircle2 className="mr-1.5 h-4 w-4 text-green-500"/>} {meal}
                        </Button>
                     ))}
                </CardContent>
            </Card>
        </div>
    );


    // --- Main Return Structure ---
    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl min-h-screen">
            {/* Back Button */}
            <Button variant="ghost" onClick={() => router.back()} className="mb-6 -ml-2 text-muted-foreground hover:text-foreground">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
            </Button>

            <h1 className="text-3xl font-bold mb-8 text-left">
                Your Health Hub
            </h1>

            {/* Display Loading or Initial Widgets */}
            {isLoading ? (
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 mb-8 opacity-50 pointer-events-none">
                    {/* Placeholder structure matching widgets */}
                    <Card className="h-[180px] flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground"/></Card>
                    <Card className="h-[180px] flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground"/></Card>
                 </div>
            ) : (
                renderInitialWidgets() // Render widgets when not loading
            )}


            {/* Divider (only show after loading) */}
            {!isLoading && <hr className="my-8 border-dashed" />}

            {/* Personalized Tasks OR General Tips (Render after loading check) */}
            <div className={cn("transition-opacity duration-500 ease-out", isLoading ? "opacity-0" : "opacity-100 animate-fade-in")}>
                 {!isLoading && ( // Double check isLoading before rendering task/tip cards
                     tasks.length > 0 ? (
                         <Card className="border-primary/20 dark:border-primary/30">
                             <CardHeader>
                                 <CardTitle className="flex items-center text-lg text-primary">
                                     <ListChecks className="mr-2 h-5 w-5"/> Personalized Recommendations
                                 </CardTitle>
                             </CardHeader>
                             <CardContent>
                                 <p className="text-sm text-muted-foreground mb-4">
                                     Based on your input and analysis. Manage completion status via the chat panel's task list.
                                 </p>
                                 {tasks.filter(t => !t.isCompleted).length > 0 && tasks.filter(t => !t.isCompleted).map(renderTaskItem)}
                                 {tasks.filter(t => t.isCompleted).length > 0 && (
                                    <>
                                        <h4 className="text-sm font-medium text-muted-foreground mt-4 mb-2 pt-4 border-t">Completed</h4>
                                        {tasks.filter(t => t.isCompleted).map(renderTaskItem)}
                                    </>
                                 )}
                                 {tasks.length > 0 && tasks.every(t => t.isCompleted) && tasks.filter(t => !t.isCompleted).length === 0 && (
                                      <p className="text-sm text-muted-foreground mt-4">All personalized tasks completed!</p>
                                 )}
                             </CardContent>
                         </Card>
                     ) : (
                         <Card className="border-border/50 bg-muted/20 dark:bg-muted/10">
                             <CardHeader>
                                 <CardTitle className="flex items-center text-lg text-secondary-foreground">
                                     <Sparkles className="mr-2 h-5 w-5 text-yellow-500"/> Daily Wellness Tips
                                 </CardTitle>
                             </CardHeader>
                             <CardContent>
                                 <p className="text-sm text-muted-foreground mb-4">
                                     Focus on these general tips for a healthy lifestyle:
                                 </p>
                                 {generalMeasures.map(renderGeneralMeasure)}
                             </CardContent>
                         </Card>
                     )
                 )}
            </div>
        </div>
    );
}

// Add fade-in animation to globals.css if you haven't already:
/*
@layer utilities {
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .animate-fade-in {
    animation: fadeIn 0.6s ease-out forwards;
  }
}
*/