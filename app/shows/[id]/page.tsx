import React from 'react'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { db } from '@/lib/db'
import { tvShows } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Clock, Users, Star, Tv, Youtube } from 'lucide-react'

interface ShowPageProps {
  params: {
    id: string
  }
}

async function getShow(id: string) {
  try {
    const show = await db
      .select()
      .from(tvShows)
      .where(eq(tvShows.id, parseInt(id)))
      .limit(1)

    if (show.length === 0) {
      return null
    }

    return show[0]
  } catch (error) {
    console.error('Error fetching show:', error)
    return null
  }
}

async function getSimilarShows(currentShow: any) {
  try {
    const similar = await db
      .select()
      .from(tvShows)
      .where(eq(tvShows.ageRange, currentShow.ageRange))
      .limit(4)

    return similar.filter(show => show.id !== currentShow.id)
  } catch (error) {
    console.error('Error fetching similar shows:', error)
    return []
  }
}

export async function generateMetadata({ params }: ShowPageProps) {
  const show = await getShow(params.id)
  
  if (!show) {
    return {
      title: 'Show Not Found | TV Tantrum'
    }
  }

  return {
    title: `${show.name} - ${show.ageRange} | TV Tantrum`,
    description: show.description.slice(0, 160) + '...',
    openGraph: {
      title: `${show.name} - Perfect for ${show.ageRange}`,
      description: show.description,
      images: show.imageUrl ? [show.imageUrl] : [],
    },
  }
}

export default async function ShowPage({ params }: ShowPageProps) {
  const show = await getShow(params.id)
  
  if (!show) {
    notFound()
  }

  const similarShows = await getSimilarShows(show)

  const getStimulationColor = (score: number) => {
    if (score <= 3) return 'bg-green-100 text-green-800'
    if (score <= 6) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  const getStimulationLabel = (score: number) => {
    if (score <= 3) return 'Low Stimulation'
    if (score <= 6) return 'Medium Stimulation'
    return 'High Stimulation'
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Button */}
      <Link 
        href="/browse" 
        className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Browse
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <div className="flex flex-col md:flex-row gap-6 mb-8">
            {show.imageUrl && (
              <div className="relative w-full md:w-80 h-96 rounded-lg overflow-hidden">
                <Image
                  src={show.imageUrl}
                  alt={show.name}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            )}
            
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-4">{show.name}</h1>
              
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant="secondary">{show.ageRange}</Badge>
                <Badge className={getStimulationColor(show.stimulationScore)}>
                  {getStimulationLabel(show.stimulationScore)}
                </Badge>
                {show.isYouTubeChannel && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Youtube className="h-3 w-3" />
                    YouTube Channel
                  </Badge>
                )}
              </div>

              <p className="text-lg text-muted-foreground mb-6">
                {show.description}
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <span>{show.episodeLength} minutes</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <span>{show.ageRange}</span>
                </div>
                {show.creativityRating && (
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-500" />
                    <span>Creativity: {show.creativityRating}/10</span>
                  </div>
                )}
                {show.seasons && (
                  <div className="flex items-center gap-2">
                    <Tv className="h-5 w-5 text-muted-foreground" />
                    <span>{show.seasons} seasons</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Additional Details */}
          <div className="space-y-6">
            {show.creator && (
              <div>
                <h3 className="text-xl font-semibold mb-2">Creator</h3>
                <p className="text-muted-foreground">{show.creator}</p>
              </div>
            )}

            {show.releaseYear && (
              <div>
                <h3 className="text-xl font-semibold mb-2">Release Information</h3>
                <p className="text-muted-foreground">
                  Released in {show.releaseYear}
                  {show.endYear && show.endYear !== show.releaseYear && ` - ${show.endYear}`}
                  {show.isOngoing && ' (Ongoing)'}
                </p>
              </div>
            )}

            {show.animationStyle && (
              <div>
                <h3 className="text-xl font-semibold mb-2">Animation Style</h3>
                <p className="text-muted-foreground">{show.animationStyle}</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Stimulation Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Stimulation Analysis</CardTitle>
              <CardDescription>
                Detailed breakdown of sensory elements
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span>Overall Score:</span>
                <Badge className={getStimulationColor(show.stimulationScore)}>
                  {show.stimulationScore}/10
                </Badge>
              </div>
              
              {show.dialogueIntensity && (
                <div className="flex justify-between">
                  <span>Dialogue:</span>
                  <span className="capitalize">{show.dialogueIntensity}</span>
                </div>
              )}
              
              {show.soundEffectsLevel && (
                <div className="flex justify-between">
                  <span>Sound Effects:</span>
                  <span className="capitalize">{show.soundEffectsLevel}</span>
                </div>
              )}
              
              {show.musicTempo && (
                <div className="flex justify-between">
                  <span>Music Tempo:</span>
                  <span className="capitalize">{show.musicTempo}</span>
                </div>
              )}
              
              {show.sceneFrequency && (
                <div className="flex justify-between">
                  <span>Scene Changes:</span>
                  <span className="capitalize">{show.sceneFrequency}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* YouTube Stats */}
          {show.isYouTubeChannel && (show.subscriberCount || show.videoCount) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Youtube className="h-5 w-5" />
                  YouTube Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {show.subscriberCount && (
                  <div className="flex justify-between">
                    <span>Subscribers:</span>
                    <span>{show.subscriberCount}</span>
                  </div>
                )}
                {show.videoCount && (
                  <div className="flex justify-between">
                    <span>Videos:</span>
                    <span>{show.videoCount}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Similar Shows */}
      {similarShows.length > 0 && (
        <div className="mt-16">
          <h2 className="text-3xl font-bold mb-8">Similar Shows</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {similarShows.map((similarShow) => (
              <Link key={similarShow.id} href={`/shows/${similarShow.id}`}>
                <Card className="hover:shadow-lg transition-shadow">
                  {similarShow.imageUrl && (
                    <div className="relative h-32 w-full overflow-hidden rounded-t-lg">
                      <Image
                        src={similarShow.imageUrl}
                        alt={similarShow.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <CardHeader className="p-4">
                    <CardTitle className="text-lg line-clamp-2">
                      {similarShow.name}
                    </CardTitle>
                    <CardDescription className="text-sm">
                      {similarShow.ageRange}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}