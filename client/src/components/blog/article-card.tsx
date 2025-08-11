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

const categoryColors = {
  "Featured Analysis": "bg-hub-blue text-white",
  "Community": "bg-green-100 text-hub-green",
  "Business": "bg-purple-100 text-purple-600",
  "Planning": "bg-blue-100 text-hub-blue"
};

export function ArticleCard({ article, onReadMore, featured = false }: ArticleCardProps) {
  const publishedDate = format(new Date(article.createdAt), 'MMMM d, yyyy');
  
  if (featured) {
    return (
      <Card className="overflow-hidden shadow-sm border border-slate-200">
        <div className="grid lg:grid-cols-2 gap-0">
          <div className="order-2 lg:order-1 p-8 lg:p-12">
            <Badge className={categoryColors[article.category] || "bg-gray-100 text-gray-600"}>
              {article.category}
            </Badge>
            <h3 className="text-2xl lg:text-3xl font-bold text-hub-dark mt-4 mb-4">
              {article.title}
            </h3>
            <p className="text-hub-gray text-lg mb-6 leading-relaxed">
              {article.excerpt}
            </p>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-hub-blue text-white rounded-full flex items-center justify-center text-sm font-semibold">
                  {article.authorName.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <div className="font-medium text-hub-dark">{article.authorName}</div>
                  <div className="text-sm text-hub-gray">{publishedDate}</div>
                </div>
              </div>
              <span className="text-sm text-hub-gray">{article.readTime} min read</span>
            </div>
            <Button 
              className="bg-hub-blue hover:bg-hub-dark-blue text-white"
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
        <Badge className={categoryColors[article.category] || "bg-gray-100 text-gray-600"}>
          {article.category}
        </Badge>
        <h4 className="font-semibold text-lg text-hub-dark mt-3 mb-3">
          {article.title}
        </h4>
        <p className="text-hub-gray text-sm mb-4">
          {article.excerpt}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-xs text-hub-gray">{publishedDate}</span>
          <Button 
            variant="ghost" 
            size="sm"
            className="text-hub-blue hover:text-hub-dark-blue"
            onClick={() => onReadMore?.(article.id)}
          >
            Read More →
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
