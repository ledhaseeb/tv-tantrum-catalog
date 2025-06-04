import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { TvShow, normalizeShow } from '@/lib/schema'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const ageRange = searchParams.get('ageRange')
    const sort = searchParams.get('sort') || 'name'
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build query conditions
    const conditions = []
    const params = []
    
    if (search) {
      conditions.push(`(name ILIKE $${params.length + 1} OR description ILIKE $${params.length + 1} OR creator ILIKE $${params.length + 1})`)
      params.push(`%${search}%`)
    }

    if (ageRange) {
      conditions.push(`age_range = $${params.length + 1}`)
      params.push(ageRange)
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    // Build order clause
    let orderClause = 'ORDER BY name ASC'
    switch (sort) {
      case 'stimulation':
        orderClause = 'ORDER BY stimulation_score DESC'
        break
      case 'creativity':
        orderClause = 'ORDER BY creativity_rating DESC'
        break
      case 'year':
        orderClause = 'ORDER BY release_year DESC'
        break
      case 'popular':
        orderClause = 'ORDER BY stimulation_score DESC, creativity_rating DESC'
        break
    }

    const query = `
      SELECT * FROM tv_shows 
      ${whereClause} 
      ${orderClause}
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `
    params.push(limit, offset)

    const result = await sql(query, params)
    const shows = result.map((row: any) => normalizeShow(row as TvShow))

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