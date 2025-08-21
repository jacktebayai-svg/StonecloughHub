"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Pound, Users, FileText, Clock, TrendingUp, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface SpendingCardProps {
  title: string;
  amount: number;
  department: string;
  date: Date;
  description: string;
  supplier?: string;
  onClick?: () => void;
}

export const SpendingCard: React.FC<SpendingCardProps> = ({
  title,
  amount,
  department,
  date,
  description,
  supplier,
  onClick
}) => {
  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={onClick}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg font-semibold line-clamp-2">{title}</CardTitle>
          <Badge variant="outline" className="ml-2 shrink-0">
            {department}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          <div className="flex items-center text-2xl font-bold text-green-600">
            <Pound className="h-5 w-5 mr-1" />
            {amount.toLocaleString()}
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
          {supplier && (
            <p className="text-sm text-blue-600">Supplier: {supplier}</p>
          )}
          <div className="flex items-center text-sm text-muted-foreground">
            <Calendar className="h-4 w-4 mr-1" />
            {formatDistanceToNow(date, { addSuffix: true })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface PlanningCardProps {
  title: string;
  reference: string;
  location: string;
  date: Date;
  description: string;
  applicant?: string;
  status?: string;
  onClick?: () => void;
}

export const PlanningCard: React.FC<PlanningCardProps> = ({
  title,
  reference,
  location,
  date,
  description,
  applicant,
  status = 'Under Review',
  onClick
}) => {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'under review': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={onClick}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg font-semibold line-clamp-1">{title}</CardTitle>
            <p className="text-sm text-blue-600 font-medium">{reference}</p>
          </div>
          <Badge className={getStatusColor(status)}>
            {status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          <div className="flex items-center text-sm">
            <MapPin className="h-4 w-4 mr-1 text-red-500" />
            <span className="font-medium">{location}</span>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
          {applicant && (
            <p className="text-sm text-gray-600">Applicant: {applicant}</p>
          )}
          <div className="flex items-center text-sm text-muted-foreground">
            <Calendar className="h-4 w-4 mr-1" />
            {formatDistanceToNow(date, { addSuffix: true })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface MeetingCardProps {
  title: string;
  committee: string;
  date: Date;
  description: string;
  agenda?: string[];
  location?: string;
  onClick?: () => void;
}

export const MeetingCard: React.FC<MeetingCardProps> = ({
  title,
  committee,
  date,
  description,
  agenda,
  location,
  onClick
}) => {
  const isUpcoming = date > new Date();
  
  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={onClick}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg font-semibold line-clamp-2">{title}</CardTitle>
          <Badge variant={isUpcoming ? "default" : "outline"} className="ml-2 shrink-0">
            {committee}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-2 text-blue-500" />
            <span className="text-sm font-medium">
              {date.toLocaleDateString()} at {date.toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </span>
          </div>
          {location && (
            <div className="flex items-center text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 mr-2" />
              {location}
            </div>
          )}
          <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
          {agenda && agenda.length > 0 && (
            <div className="mt-2">
              <p className="text-sm font-medium mb-1">Agenda Items:</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                {agenda.slice(0, 3).map((item, index) => (
                  <li key={index} className="flex items-start">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-2 shrink-0" />
                    <span className="line-clamp-1">{item}</span>
                  </li>
                ))}
                {agenda.length > 3 && (
                  <li className="text-xs text-blue-600">+{agenda.length - 3} more items</li>
                )}
              </ul>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

interface SummaryStatsProps {
  totalRecords: number;
  planningApplications: number;
  councilSpending: number;
  totalSpendingAmount: number;
  councilMeetings: number;
  lastUpdated: Date;
}

export const SummaryStats: React.FC<SummaryStatsProps> = ({
  totalRecords,
  planningApplications,
  councilSpending,
  totalSpendingAmount,
  councilMeetings,
  lastUpdated
}) => {
  const stats = [
    {
      title: 'Total Records',
      value: totalRecords.toLocaleString(),
      icon: FileText,
      color: 'text-blue-600'
    },
    {
      title: 'Planning Applications',
      value: planningApplications.toLocaleString(),
      icon: MapPin,
      color: 'text-green-600'
    },
    {
      title: 'Council Meetings',
      value: councilMeetings.toLocaleString(),
      icon: Users,
      color: 'text-purple-600'
    },
    {
      title: 'Total Spending',
      value: `£${totalSpendingAmount.toLocaleString()}`,
      icon: Pound,
      color: 'text-red-600',
      subtitle: `${councilSpending} transactions`
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat, index) => (
        <Card key={index}>
          <CardContent className="p-6">
            <div className="flex items-center">
              <stat.icon className={`h-8 w-8 ${stat.color}`} />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                <div className="flex items-center">
                  <p className="text-2xl font-bold">{stat.value}</p>
                  {stat.subtitle && (
                    <p className="text-xs text-muted-foreground ml-2">{stat.subtitle}</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      
      {/* Last Updated Card */}
      <Card className="md:col-span-2 lg:col-span-4">
        <CardContent className="p-4">
          <div className="flex items-center justify-center text-sm text-muted-foreground">
            <Clock className="h-4 w-4 mr-2" />
            <span>Last updated: {formatDistanceToNow(lastUpdated, { addSuffix: true })}</span>
            <TrendingUp className="h-4 w-4 ml-4 mr-1 text-green-500" />
            <span className="text-green-600">Data actively monitored</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

interface ActivityFeedProps {
  activities: Array<{
    id: string;
    title: string;
    dataType: string;
    date: Date;
    createdAt: Date;
    amount?: number;
    location?: string;
  }>;
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ activities }) => {
  const getActivityIcon = (dataType: string) => {
    switch (dataType) {
      case 'planning_application': return MapPin;
      case 'council_spending': return Pound;
      case 'council_meeting': return Users;
      case 'council_page': return FileText;
      default: return AlertCircle;
    }
  };

  const getActivityColor = (dataType: string) => {
    switch (dataType) {
      case 'planning_application': return 'text-green-600';
      case 'council_spending': return 'text-red-600';
      case 'council_meeting': return 'text-purple-600';
      case 'council_page': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const formatDataType = (dataType: string) => {
    return dataType.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Clock className="h-5 w-5 mr-2" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {activities.map((activity) => {
            const ActivityIcon = getActivityIcon(activity.dataType);
            return (
              <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <ActivityIcon className={`h-5 w-5 mt-0.5 ${getActivityColor(activity.dataType)}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium line-clamp-2">{activity.title}</p>
                  <div className="flex items-center space-x-4 mt-1 text-xs text-muted-foreground">
                    <span className="bg-gray-100 px-2 py-1 rounded">
                      {formatDataType(activity.dataType)}
                    </span>
                    {activity.amount && (
                      <span className="text-green-600 font-medium">
                        £{activity.amount.toLocaleString()}
                      </span>
                    )}
                    {activity.location && (
                      <span className="flex items-center">
                        <MapPin className="h-3 w-3 mr-1" />
                        {activity.location}
                      </span>
                    )}
                    <span>{formatDistanceToNow(activity.createdAt, { addSuffix: true })}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
