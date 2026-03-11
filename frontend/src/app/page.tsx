"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

// Define the shape of our localized data
interface Trend {
  source: string;
  original_lang: string;
  english_title: string;
  english_body: string;
  url: string;
  category: string;
}

export default function Dashboard() {
  const [trends, setTrends] = useState<Trend[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("All");

  // Fetch the local JSON file on load
  useEffect(() => {
    fetch("/categorized_global_trends.json")
      .then((res) => res.json())
      .then((data) => setTrends(data))
      .catch((err) => console.error("Failed to load data", err));
  }, []);

  // Extract unique categories for the filter buttons
  const categories = ["All", ...Array.from(new Set(trends.map((t) => t.category)))];

  // Filter the feed based on the selected category
  const filteredTrends =
    activeCategory === "All"
      ? trends
      : trends.filter((t) => t.category === activeCategory);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50 p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Global Arbitrage</h1>
          <p className="text-neutral-400">
            Real-time, cross-border startup intelligence powered by Lingo.dev.
          </p>
        </div>

        <Separator className="bg-neutral-800" />

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Sidebar Filters */}
          <div className="col-span-1 space-y-4">
            <h3 className="font-semibold text-lg">Trend Categories</h3>
            <div className="flex flex-col space-y-2">
              {categories.map((cat) => (
                <Button
                  key={cat}
                  variant={activeCategory === cat ? "default" : "secondary"}
                  className="justify-start"
                  onClick={() => setActiveCategory(cat)}
                >
                  {cat}
                </Button>
              ))}
            </div>
          </div>

          {/* Main Feed */}
          <div className="col-span-3">
            <ScrollArea className="h-[750px] pr-4">
              <div className="grid grid-cols-1 gap-4">
                {filteredTrends.map((trend, idx) => (
                  <Card key={idx} className="bg-neutral-900 border-neutral-800">
                    <CardHeader>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex space-x-2">
                          <Badge variant="outline" className="text-blue-400 border-blue-400/30">
                            {trend.source}
                          </Badge>
                          <Badge variant="secondary">{trend.original_lang.toUpperCase()}</Badge>
                        </div>
                        <Badge className="bg-indigo-600 hover:bg-indigo-700">
                          {trend.category}
                        </Badge>
                      </div>
                      <CardTitle className="text-xl text-neutral-100">
                        {trend.english_title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <CardDescription className="text-neutral-300 leading-relaxed">
                        {trend.english_body}
                      </CardDescription>
                      <a
                        href={trend.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-indigo-400 hover:underline"
                      >
                        View Original Post →
                      </a>
                    </CardContent>
                  </Card>
                ))}
                {filteredTrends.length === 0 && (
                  <div className="text-center text-neutral-500 py-10">
                    No trends found for this category.
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
          
        </div>
      </div>
    </div>
  );
}