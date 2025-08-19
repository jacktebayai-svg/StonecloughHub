import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import type { BlogArticle } from "@shared/schema";

interface ArticleCardProps {
  article: BlogArticle;
  onReadMore?: (id: string) => void;
  featured?: boolean;
}

const categoryColors: Record<string, string> = {
  "Featured Analysis": "bg-stoneclough-blue text-stoneclough-light",
  "Community": "bg-stoneclough-gray-blue/10 text-stoneclough-gray-blue",
  "Business": "bg-stoneclough-orange/10 text-stoneclough-orange",
  "Planning": "bg-stoneclough-yellow/10 text-stoneclough-yellow",
};

export function ArticleCard({ article, onReadMore, featured = false }: ArticleCardProps) {
  const publishedDate = format(new Date(article.createdAt), 'MMMM d, yyyy');
  
  if (featured) {
    return (
      <Card className="overflow-hidden shadow-sm border border-slate-200">
        <div className="grid lg:grid-cols-2 gap-0">
          <div className="order-2 lg:order-1 p-8 lg:p-12">
            <Badge className={categoryColors[article.category] || "bg-stoneclough-light text-stoneclough-gray-blue"}>
              {article.category}
            </Badge>
            <h3 className="text-2xl lg:text-3xl font-bold text-stoneclough-blue mt-4 mb-4">
              {article.title}
            </h3>
            <p className="text-stoneclough-gray-blue text-lg mb-6 leading-relaxed">
              {article.excerpt}
            </p>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-stoneclough-blue text-stoneclough-light rounded-full flex items-center justify-center text-sm font-semibold">
                  {article.authorName.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <div className="font-medium text-stoneclough-blue">{article.authorName}</div>
                  <div className="text-sm text-stoneclough-gray-blue">{publishedDate}</div>
                </div>
              </div>
              <span className="text-sm text-stoneclough-gray-blue">{article.readTime} min read</span>
            </div>
            <Button 
              className="bg-stoneclough-blue hover:bg-stoneclough-blue/90 text-stoneclough-light"
              onClick={() => onReadMore?.(article.id)}
            >
              Read Full Analysis
            </Button>
          </div>
          <div className="order-1 lg:order-2">
            {article.imageUrl && (
              <img 
                src={article.imageUrl} 
                alt={article.title}
                className="w-full h-64 lg:h-full object-cover"
              />
            )}
          </div>
        </div>
      </Card>
    );
  }
  
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      {article.imageUrl && (
        <img 
          src={article.imageUrl} 
          alt={article.title}
          className="w-full h-48 object-cover"
        />
      )}
      <CardContent className="p-6">
        <Badge className={categoryColors[article.category] || "bg-stoneclough-light text-stoneclough-gray-blue"}>
          {article.category}
        </Badge>
        <h4 className="font-semibold text-lg text-stoneclough-blue mt-3 mb-3">
          {article.title}
        </h4>
        <p className="text-stoneclough-gray-blue text-sm mb-4">
          {article.excerpt}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-xs text-stoneclough-gray-blue">{publishedDate}</span>
          <Button 
            variant="ghost" 
            size="sm"
            className="text-stoneclough-blue hover:text-stoneclough-blue/90"
            onClick={() => onReadMore?.(article.id)}
          >
            Read More →
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}