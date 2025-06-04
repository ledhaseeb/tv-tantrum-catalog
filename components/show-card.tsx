import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Show } from '@/lib/schema'
import { Clock, Users, Star } from 'lucide-react'

interface ShowCardProps {
  show: Show
  compact?: boolean
}

export function ShowCard({ show, compact = false }: ShowCardProps) {
  const getStimulationColor = (score: number) => {
    if (score <= 3) return 'text-green-600 bg-green-100'
    if (score <= 6) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  const getStimulationLabel = (score: number) => {
    if (score <= 3) return 'Low'
    if (score <= 6) return 'Medium'
    return 'High'
  }

  return (
    <Link href={`/shows/${show.id}`}>
      <Card className="hover:shadow-lg transition-shadow duration-200 cursor-pointer h-full">
        <div className="relative">
          {show.imageUrl && (
            <div className={`relative ${compact ? 'h-32' : 'h-48'} w-full overflow-hidden rounded-t-lg`}>
              <Image
                src={show.imageUrl}
                alt={show.name}
                fill
                className="object-cover"
                sizes={compact ? '(max-width: 768px) 100vw, 25vw' : '(max-width: 768px) 100vw, 33vw'}
              />
            </div>
          )}
          
          {/* Stimulation Score Badge */}
          <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium ${getStimulationColor(show.stimulationScore)}`}>
            {getStimulationLabel(show.stimulationScore)}
          </div>
        </div>

        <CardHeader className={compact ? 'p-4' : 'p-6'}>
          <CardTitle className={`${compact ? 'text-lg' : 'text-xl'} line-clamp-2`}>
            {show.name}
          </CardTitle>
          {!compact && (
            <CardDescription className="line-clamp-3">
              {show.description}
            </CardDescription>
          )}
        </CardHeader>

        <CardContent className={`${compact ? 'p-4 pt-0' : 'p-6 pt-0'} space-y-2`}>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{show.ageRange}</span>
            </div>
            {show.episodeLength && (
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{show.episodeLength}m</span>
              </div>
            )}
          </div>
          
          {show.creativityRating && (
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 text-yellow-500" />
              <span className="text-sm text-muted-foreground">
                Creativity: {show.creativityRating}/10
              </span>
            </div>
          )}

          {!compact && show.creator && (
            <p className="text-sm text-muted-foreground">
              By {show.creator}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}