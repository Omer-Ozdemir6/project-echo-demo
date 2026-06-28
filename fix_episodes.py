import re

with open('src/data/episodes/merged_story.json', 'r', encoding='utf-8') as f:
    content = f.read()

# Episode-05 characterBusy: returnNodeId ep06_n01 -> add returnEpisodeId episode_06
content = re.sub(
    r'("returnNodeId": "ep06_n01",\s*\n\s*")("message")',
    r'\g<1>returnEpisodeId": "episode_06",\n            \g<2>',
    content
)

# Episode-04 characterBusy: returnNodeId ep05_n01 -> add returnEpisodeId episode_05
content = re.sub(
    r'("returnNodeId": "ep05_n01",\s*\n\s*")("message")',
    r'\g<1>returnEpisodeId": "episode_05",\n            \g<2>',
    content
)

with open('src/data/episodes/merged_story.json', 'w', encoding='utf-8') as f:
    f.write(content)

print('Done')