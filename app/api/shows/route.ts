import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { tvShows, tvShowThemes, themes, tvShowPlatforms, platforms } from '@/lib/schema'
import { eq, desc, asc, like, and, or, inArray } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const ageRange = searchParams.get('ageRange')
    const platform = searchParams.get('platform')
    const theme = searchParams.get('theme')
    const sort = searchParams.get('sort') || 'name'
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = db.select().from(tvShows)

    // Apply filters
    const conditions = []
    
    if (search) {
      conditions.push(
        or(
          like(tvShows.name, `%${search}%`),
          like(tvShows.description, `%${search}%`),
          like(tvShows.creator, `%${search}%`)
        )
      )
    }

    if (ageRange) {
      conditions.push(eq(tvShows.ageRange, ageRange))
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions))
    }

    // Apply sorting
    switch (sort) {
      case 'name':
        query = query.orderBy(asc(tvShows.name))
        break
      case 'stimulation':
        query = query.orderBy(desc(tvShows.stimulationScore))
        break
      case 'creativity':
        query = query.orderBy(desc(tvShows.creativityRating))
        break
      case 'year':
        query = query.orderBy(desc(tvShows.releaseYear))
        break
      default:
        query = query.orderBy(asc(tvShows.name))
    }

    // Apply pagination
    query = query.limit(limit).offset(offset)

    const shows = await query

    return NextResponse.json({
      shows,
      pagination: {
        limit,
        offset,
        hasMore: shows.length === limit
      }
    })

  } catch (error) {
    console.error('Error fetching shows:', error)
    return NextResponse.json(
      { error: 'Failed to fetch shows' },
      { status: 500 }
    )
  }
}