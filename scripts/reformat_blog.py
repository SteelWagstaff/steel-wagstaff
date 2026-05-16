#!/usr/bin/env python3
"""Reformat the quotations blog post to separate embedded author sections."""

import re

file_path = "/home/steelwagstaff/Code/steel-wagstaff/src/content/blog/en/10-years-later-quotations-for-a-friend.md"

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Find the line number where Antoine de Saint-Expury section starts
lines = content.split('\n')
antoine_idx = None
for i, line in enumerate(lines):
    if '## **Antoine de Saint-Expury' in line:
        antoine_idx = i
        break

if antoine_idx is None:
    print("Could not find Antoine section")
    exit(1)

# Keep everything up to Antoine section
before_antoine = '\n'.join(lines[:antoine_idx + 1])  # Include the h2 header

# New formatted content for Antoine onwards
new_content = """## **Antoine de Saint-Expury (french aviator and author of the Little Prince, died young in plane crash)**
- One can be a brother only _in_ something. Where there is no tie that binds men, men are not united but merely lined up.
- Each man must look to himself to teach him the meaning of life. It is not something discovered: it is something moulded.
- When the body sinks into death, the essense of man is revealed. Man is a knot, a web, a mesh into which relationships are tied. Only those relationships matter. The body is an old crock that nobody will miss. I have never known a man to think of himself when dying. Never.
- Love does not consist in gazing at each other but in looking together in the same direction.
- Only he can understand what a farm is, what a country is, who shall have sacrificed part of himself to his farm or country, fought to save it, struggled to make it beautiful. Only then will the love of farm or country fill his heart.
- On a day of burial there is no perspective—for space itself is annihilated. Your dead friend is still a fragmentary being. The day you bury him is a day of chores and crowds, of hands false or true to be shaken, of the immediate cares of mourning. The dead friend will not really die until tomorrow, when silence is round you again. Then he will show himself complete, as he was—to tear himself away, as he was, from the substantial you. Only then will you cry out because of him who is leaving and whom you cannot detain.

## **Alexander Solzhenitsyn (russian author, won 1970 nobel prize in literature but soviet authorities refused to let him receive the award, rad dude)**
- Justice _is_ conscience, not a personal conscience but the conscience of the whole of humanity. Those who clearly recognize the voice of their own conscience usually recognize also the voice of justice.
- Violence can only be concealed by a lie, and the lie can only be maintained by violence. Any man who has once proclaimed violence as his method is inevitably forced to take the lie as his principle.

## **Fidel Castro (communist revolutionary leader, island dictator)**
- I began revolution with 82 men. If I had [to] do it again, I do it with 10 or 15 and absolute faith. It does not matter how small you are if you have faith and plan of action.
- I feel my belief in sacrifice and struggle getting stronger. I despise the kind of existence that clings to the miserly trifles of comfort and self-interest. I think that a man should not live beyond the age when he begins to deteriorate, when the flame that lighted the brightest moment of his life has weakened.

## **Noam Chomsky (linguist and wacky guy)**
- Suppose that humans happen to be so constructed that they desire the opportunity for freely undertaken productive work. Suppose that they want to be free from the meddling of technocrats and commissars, bankers and tycoons, mad bombers who engage in psychological tests of will with peasants defending their homes, behavioral scientists who can't tell a pigeon from a poet, or anyone else who tries to wish freedom and dignity out of existence or beat them into oblivion.

## **Salmon Rushdie (you know him)**
Our lives teach us who we are.

## **George Santayana (philosopher, seems rad but I know little of him)**
- Fun is a good thing but only when it spoils nothing better.
- It is veneer, rouge, aetheticism, art museums, new theaters, etc. that makeAmericaimpotent. The good things are football, kindness, and jazz bands.

## **Unknown origin (motto of various rad religious leaders)**
In necessary things, unity; in disputed things, liberty; in all things, charity.

## **John Berger (author)**
Compassion has no place in the natural order of the world which operates on the basis of necessity. Compassion opposes this order and is therefore best thought of as being in some way supernatural.

## **Lillian Hellman (american screenwriter)**
- I cannot and will not cut my conscience to fit this year's fashions. (when refusing to testify against suspected Communists before the House Committee on Un-American Activites during the 2nd Red Scare)

## **Thomas Szasz (american psychiatrist, reminds me a lot of my uncle)**
- When a man says that he is Jesus or Napoleon, or that the Martians are after him, or claims something else that seems outrageous to common sense, he is labeled psychotic and locked up in a madhouse. Freedom of speech is only for normal people.
- The proverb warns that "You should not bite the hand that feeds you." But maybe you should, if it prevents you from feeding yourself.
- People often say that this or that person has not yet found himself. But the self is not something one finds; it is something one creates.
- The stupid neither forgive nor forget; the naïve forgive and forget; the wise forgive but do not forget.
- When a person can no longer laugh at himself, it is time for others to laugh at him.
- Every act of conscious learning requires the willingness to suffer an injury to one's self-esteem. That is why young children, before they are aware of their own self-importance, learn so easily; and why older persons, especially if vain or important, cannot learn at all.
- If someone does something we disapprove of, we regard him as bad if we believe we can deter him from persisting in his conduct, but we regard him as mad if we believe we cannot. In either case, the crucial issue is our control of the other: the more we lose control over him, and the more he assumes control over himself, the more, in case of conflict, we are likely to consider him mad rather than just bad.

## **Vaclav Havel (czech playwright, president)**
- The dissident does not operate in the realm of genuine power at all. He is not seeking power. He has no desire for office and does not gather votes. He does not attempt to charm the public, he offers nothing and promises nothing. He can offer, if anything, only his own skin—and he offers it solely because he has no other way of affirming the truth he stands for. His actions simply articulate his dignity as a citizen, regardless of the cost.

## **Eugene v. Debs (american socialist, in 1920 he received over 1 million presidential votes while in prison for speaking against World War One)**
While there is a lower class, I am in it; while there is a criminal element, I am of it; and while there is a soul in prison, I am not free.

## **Martin Luther King Jr. (I'm not sure who he is, but I think Bono wrote some songs about him +-)**
- It may be true that the law cannot make a man love me, but it can keep him from lynching me, and I think that's pretty important.
- There can be no deep disappointment where there is not deep love.
- It is my hope that as the Negro plunges deeper into the quest for freedom and justice he will plunge even deeper into the philosophy of non-violence. The Negro all over the South must come to the point that he can say to his white brother: "We will match your capacity to inflict suffering with our capacity to endure suffering. We will meet your physical force with soul force. We will not hate you, but we will not obey your evil laws. We will soon wear you down by pure capacity to suffer."
- One who breaks an unjust law that conscience tells him is unjust, and who willingly accepts the penalty of imprisonment in order to arouse the conscience of the community over its injustice, is in reality expressing the highest respect for law.

## **Natalie Clifford Barney (author)**
Why grab possessions like thieves, or divide them like socialists when you can ignore them like wise men?

## **Søren Kierkegaard (danish religious existentialist philosopher, troubled genius)**
- This is what is sad when one contemplates human life, that so many live out their lives in quiet lostness . . . they live, as it were, away from themselves and vanish like shadows. Their immortal souls are blown away, and they are not disquieted by the question of its immortality, because they are already disintegrated before they die.

## **Martin Amis (contemporary British author)**
Bullets cannot be recalled. They cannot be uninvented. But they can be taken out of the gun.

## **Vera Brittain (author, pacifist)**
All that a pacifist can undertake—but it is a very great deal—is to refuse to kill, injure or otherwise cause suffering to another human creature, and untiringly to order his life by the rule of love though others may be captured by hate.

## **Bertrand Russell (philosopher, mathematician, social critic, writer)**
This idea of weapons of mass extermination s utterly horrible and is something which no one with one spark of humanity can tolerate. I will not pretend to obey a government which is organising a mass massacre of mankind.

## **Victor Hugo (author, revolutionary sympathizer)**
- Do not ask the name of the person who seeks a bed for the night. He who is reluctant to give his name is the one who most needs shelter.

## **Milan Kundera (author)**
Mankind's true moral test, its fundamental test (which lies deeply buried from view), consists of its attitude towards those who are at its mercy: animals. And in this respect mankind has suffered a fundamental debacle, a debacle so fundamental that all others stem from it.

## **Mark Twain (rad dude)**
The fact that man knows right from wrong proves his _intellectual_ superiority to the other creatures; but the fact that he can _do_ wrong proves his _moral_ inferiority to any creatures that _cannot._

## **Lydia M. Child (abolitionist, writer, optimist)**
- That man's best works should be such bungling imitations of Nature's infinite perfection, matters not much; but that he should make himself an imitation, this is the fact which Nature moans over, and deprecates beseechingly. Be spontaneous, be truthful, be free, and thus be individuals! is the song she sings through warbling birds, and whispering pines, and roaring waves, and screeching winds.
- The nearer society approaches to divine order, the less separation will there be in the characters, duties, and pursuits of men and women. Women will not become less gentle and graceful, but men will become more so. Women will not neglect the care and education of their children, but men will find themselves ennobled and refined by sharing those duties with them; and will receive, in return, co-operation and sympathy in the discharge of various other duties, now deemed inappropriate to women. The more women become rational companions, partners in business and in thought, as well as in affection and amusement, the more highly will men appreciate home.

## **Don Marquis (rad poet)**
Writing a book of poetry is like dropping a rose petal down the Grand Canyon and waiting for the echo."""

# Reconstruct the file
final_content = before_antoine + '\n' + new_content

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(final_content)

print(f"✓ File reformatted successfully")
