export default async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return res.status(503).json({
      error: 'The log needs a GitHub token configured in Vercel.'
    });
  }

  try {
    const response = await fetch(
      'https://api.github.com/repos/iamlxwis/portfolio/commits?per_page=30',
      {
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: 'Bearer ' + token,
          'X-GitHub-Api-Version': '2022-11-28'
        }
      }
    );

    if (!response.ok) {
      return res.status(response.status).json({
        error: 'GitHub could not return the repository commits.'
      });
    }

    const commits = await response.json();
    return res.status(200).json(commits);
  } catch (error) {
    return res.status(502).json({ error: 'Could not connect to GitHub.' });
  }
}
