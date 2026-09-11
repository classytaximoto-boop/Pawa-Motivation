// Contenu de motivation local — aucune dépendance réseau, disponible offline.
// Regroupé en 2 collections : les scripts "confiance en soi" (courts, ciblés)
// et le grand recueil par thème (plus long, organisé en sections/sous-thèmes).

export const confidenceScripts = [
  {
    id: 'menace-attaque',
    title: 'Ne jamais réagir à chaud face à une menace ou une attaque',
    body: `Voici la règle que personne ne t'apprend : celui qui réagit en premier a déjà perdu.

Quand quelqu'un te menace, t'attaque verbalement, essaie de t'intimider, il ne cherche pas une réponse — il cherche une réaction. Il veut voir ta voix trembler, il veut voir ta main trembler, il veut voir que ça t'a atteint. Ne lui donne pas ça.

Le silence n'est pas de la faiblesse, c'est une arme. Celui qui reste calme pendant que l'autre s'énerve, c'est celui qui contrôle la pièce. Un homme sûr de lui ne prouve rien, il n'a rien à prouver. Il regarde, il écoute, il attend — et c'est cette attente qui rend l'autre encore plus nerveux, parce qu'il ne sait plus quoi faire d'un silence.

Face à une autorité qui hausse le ton, face à un supérieur qui t'écrase avec des mots, ne baisse pas les yeux comme un coupable, et ne monte pas dans les tours comme un enfant qui panique. Reste droit, reste posé, réponds seulement si ta réponse a une valeur.

L'intimidation ne fonctionne que sur ceux qui doutent déjà d'eux-mêmes. Le jour où tu sais qui tu es, plus rien ne peut te secouer de l'extérieur — parce que ta valeur ne dépend plus du regard ou du ton de celui qui te parle.

Accepte les critiques, mais n'accepte jamais le manque de respect. La différence entre les deux, c'est que la critique construit, l'irrespect ne cherche qu'à te détruire.`,
  },
  {
    id: 'estime-abandon',
    title: 'Ton estime de soi ne dépend pas de ceux qui partent',
    body: `Il y a une vérité difficile, mais il faut l'entendre : les gens partent. Certains restent une saison, d'autres une vie — mais certains partent, et ce n'est pas toujours de ta faute.

Le problème, ce n'est pas qu'ils partent. Le problème, c'est ce que tu te racontes après. Beaucoup transforment un départ en verdict : « je ne suis pas assez bien », « je ne mérite pas », « c'est de ma faute ». Arrête ça tout de suite. Un départ, ce n'est pas un jugement sur ta valeur — c'est juste la fin d'un chapitre entre deux personnes qui n'allaient plus dans la même direction.

Ta valeur n'a jamais été entre les mains de celui qui reste ou qui part. Ta valeur, c'est toi qui la fixes, en silence, dans la façon dont tu te reconstruis après chaque perte. Un homme qui a une vraie estime de lui-même peut pleurer un départ, peut ressentir le vide — mais il ne se met jamais à genoux en se demandant ce qu'il aurait dû faire différemment pour mériter d'être aimé.

Ne cours jamais après quelqu'un qui a décidé de partir. Ne mendie pas une place que quelqu'un ne veut plus t'offrir. Laisse partir avec dignité ceux qui doivent partir, et garde ton énergie pour construire la version de toi qui n'aura plus jamais besoin de supplier pour être vu.

Et surtout : ne laisse jamais un projet qui échoue, ni une personne qui s'en va, réécrire qui tu es. Toi, tu restes. Le reste passe.`,
  },
  {
    id: 'echec-projet',
    title: "Quand ton projet s'écroule, c'est toi qui décides ce que ça veut dire",
    body: `Un projet qui échoue n'est pas la preuve que tu es nul — c'est juste une donnée. Une information. Rien de plus.

Le monde va te faire croire que l'échec est une sentence. Que si ce projet ne marche pas, alors toi non plus tu ne marches pas. C'est faux, et c'est l'histoire la plus dangereuse que tu puisses te raconter.

Ce projet, ce n'est pas toi. Ton business, ce n'est pas toi. Ton couple qui s'effondre, ce n'est pas toi. Ce sont des choses que tu as essayées — et essayer, ça veut dire que tu as eu le courage de te mettre en jeu, pendant que d'autres restaient sur le bord à ne rien risquer du tout.

Un homme avec une vraie confiance en lui ne demande pas à la vie de ne jamais rater. Il demande juste la force de recommencer. Il sépare ce qu'il fait de ce qu'il est. Il peut perdre un projet et rester entier. Il peut perdre de l'argent et rester riche de lui-même.

Alors quand quelque chose s'écroule, pose-toi juste une question : qu'est-ce que ça m'apprend, pas qu'est-ce que ça prouve contre moi. Un échec bien digéré devient une compétence. Un échec mal digéré devient une identité — et toi, tu ne dois jamais laisser un mauvais résultat devenir ton identité.`,
  },
  {
    id: 'ne-pas-s-en-foutre',
    title: "Ne t'en fous pas, même si le monde entier n'est pas avec toi",
    body: `Il y a une grosse erreur dans beaucoup de discours de motivation : on te dit « ignore tout le monde, fous-toi de tout ». Non. Ce n'est pas ça la vraie force.

La vraie force, ce n'est pas de ne plus rien ressentir. C'est de continuer à avancer même quand ça fait mal, même quand personne n'y croit avec toi. Tu peux être blessé par le silence de ceux qui devraient te soutenir, et continuer quand même. Tu peux ressentir la solitude d'un chemin où personne ne t'accompagne, et continuer quand même.

Ne t'en fous pas. Ressens. Mais ne laisse jamais ce que tu ressens décider à ta place si tu continues ou si tu abandonnes.

Le monde entier peut douter de toi. Ta famille peut ne pas comprendre ton chemin. Tes amis peuvent s'éloigner en cours de route. Et pourtant, ce que tu construis reste valable — parce que la valeur d'un chemin ne se mesure pas au nombre de personnes qui marchent avec toi, mais à ta capacité à continuer d'avancer même seul.

Un homme debout n'est pas celui qui n'a jamais eu mal. C'est celui qui a eu mal, qui l'a senti jusqu'au bout, et qui s'est quand même relevé le lendemain matin pour continuer à se construire.

Si personne n'est avec toi aujourd'hui, retiens ça : tu n'as pas besoin de leur validation pour avoir raison d'essayer. Le jour où tu réussis, ils viendront tous te dire qu'ils y avaient toujours cru.`,
  },
];

// Recueil par thème — sections avec sous-thèmes, format identique au PDF
// "Scripts Capitaine". Chaque section a un id, un titre, et une liste
// d'items { title, body }.
export const themeCollection = [
  {
    id: 'amour-relations',
    title: "L'amour et les relations",
    items: [
      {
        title: "L'homme fiable",
        body: `Un homme qui est toujours là pour toi, ce n'est pas de la chance, c'est un choix. À chaque message il répond, à chaque appel il décroche. Quand tu as besoin de lui, il est là — pas parce qu'il s'ennuie, pas parce qu'il n'a rien d'autre à faire, mais parce que tu comptes, parce qu'il t'a fait une place spéciale dans sa vie.

Ne le prends pas pour acquis. Un jour, s'il part, tu sentiras la différence entre la chaleur et le froid. Un homme comme lui, tu n'en croises pas deux. Il est là par amour, pas par obligation.

N'oublie jamais : parfois la vraie chance ne frappe qu'une seule fois. Ne laisse pas filer ce qui vaut vraiment la peine d'être gardé.`,
      },
      {
        title: "Signes qu'un homme s'investit vraiment",
        body: `Si un homme ne change rien dans sa vie pour toi, c'est que tu n'as rien changé dans la sienne, point final. Un homme qui veut juste passer du temps t'écrit. Un homme qui veut construire s'adapte — il te le montre pas avec des mots mais avec des actes.

Il annule des plans pour te voir, fait attention à ce que tu aimes et corrige ce qui te dérange. Il commence à faire de toi une priorité. Ce n'est pas qu'il devient parfait, c'est qu'il fait des efforts — et les efforts, on ne les fait pas pour n'importe qui.

Alors si tu remarques ces petits changements chez quelqu'un, ne les minimise pas : un vrai homme se repositionne quand il voit de la valeur. Et s'il ne le fait pas, c'est qu'il ne te voit pas comme tu crois.`,
      },
      {
        title: "L'amour véritable au-delà du rêve initial",
        body: `Au début, l'amour ressemble à un rêve éveillé : tout est léger, chaque message fait sourire, chaque regard fait battre le cœur plus vite. On se promet le monde, on se comprend sans parler, on plane.

Mais ensuite la réalité frappe : les défauts apparaissent, les petites habitudes agacent, les disputes éclatent, parfois pour des détails ridicules. C'est là que beaucoup baissent les bras, pensant que l'amour s'éteint — mais en vérité, c'est là qu'il commence à naître. Parce que l'amour, le vrai, ne se mesure pas au moment parfait, mais à la capacité de traverser les tempêtes à deux.

Et puis un jour, sans que tu t'en rendes compte, tu réalises que tu n'as plus besoin de crier pour te faire entendre, que tu sais quand te taire, quand parler, quand tendre la main. Tu ne cherches plus à changer l'autre, tu apprends à l'aimer tel qu'il est. C'est là, dans cette paix après la guerre, que l'amour devient profond, solide, indestructible.`,
      },
      {
        title: 'Accepter les compromis en amour',
        body: `Si tu penses qu'un jour tu tomberas sur la personne parfaite, tu risques de passer à côté de l'amour réel toute ta vie. Le mec qui gagne bien sa vie n'a peut-être jamais le temps. Celui qui est loyal peut sembler ennuyeux. Celui qui est drôle n'est pas toujours stable. Celui qui t'écoute avec patience ne sera pas toujours celui qui te fait vibrer.

Il y a toujours un compromis, parce que personne n'a le package complet. Le problème, ce n'est pas ton partenaire, c'est l'illusion qu'un jour tu trouveras quelqu'un qui n'a aucun défaut. Les couples solides, ce ne sont pas des gens chanceux, ce sont des gens courageux.

L'amour, le vrai, ce n'est pas un film romantique. C'est faire les choses simples quand on n'a pas envie, c'est tenir bon quand tout te pousse à lâcher.`,
      },
      {
        title: "Douze signes d'une femme de grande valeur",
        body: `1. Supportive — elle encourage tes objectifs et tes rêves.
2. Digne de confiance et loyale — tu peux lui confier tes secrets.
3. Communication — elle parle ouvertement et honnêtement avec toi.
4. Respect — elle respecte tes limites.
5. Gentillesse — elle est vraiment gentille avec les autres, pas seulement pour t'impressionner.
6. Honnêteté — elle est véridique même quand c'est difficile.
7. Empathie — elle comprend et se soucie de tes sentiments.
8. Résilience — elle fait face aux défis avec grâce.
9. Attitude positive et sens de l'humour.
10. Responsable — elle prend soin de ses obligations.
11. Respectueuse des différences — elle respecte tes opinions même si elle diffère.`,
      },
      {
        title: 'Méfiance envers les relations opportunistes',
        body: `Certaines personnes ne viennent pas dans ta vie pour t'aimer, elles viennent pour te manipuler. Elles ne viennent pas pour apporter quelque chose à ta vie, mais pour en prendre. Elles ne te voient pas en tant que personne, mais comme une opportunité.

Elles ne te sont pas loyales, elles sont loyales aux avantages qui viennent avec toi — c'est pourquoi elles ne se manifestent jamais, peu importe combien de fois tu as été là pour elles.

Arrête de te casser le dos pour des gens qui clairement ne valent pas la peine.`,
      },
      {
        title: 'Le serpent (se méfier des personnes proches)',
        body: `Une femme avait un serpent domestique qu'elle aimait avoir à sa compagnie. Un jour, il arrêta subitement de manger. Le vétérinaire lui demanda si elle dormait avec lui la nuit, et si celui-ci se repliait tout près d'elle en s'étirant. Elle répondit oui, tous les jours.

Le vétérinaire lui dit alors : « Madame, votre serpent n'est pas malade. Il se préparait à vous manger. Il vous mesurait tous les jours pour savoir quelle taille il devait atteindre pour parvenir à vous digérer entièrement. »

Morale : reconnaissez les serpents autour de vous. Le fait qu'ils semblent proches de vous ne signifie pas que leurs intentions ne sont pas de vous dévorer.`,
      },
      {
        title: 'Cinq personnes qui peuvent ruiner ta vie',
        body: `1. L'utilisateur — il ne t'aimera que tant qu'il peut t'utiliser.
2. Le plaignant — il vole ta paix en se plaignant des mêmes choses qu'il n'est pas prêt à changer.
3. Le blâmeur — il te fait te sentir coupable et ne prend jamais ses responsabilités.
4. Le concurrent — il peut vouloir te voir réussir, mais sûrement pas mieux que lui.
5. L'oppresseur — il abuse de ton pardon, de ta confiance et de ta loyauté.`,
      },
      {
        title: 'Trois types de personnes dans ta vie',
        body: `Type 1 — les personnes feuilles : elles entrent dans ta vie pour une seule saison ; ne t'habitue pas à elles, elles sont fragiles.

Type 2 — les personnes branches : plus solides, mais reste sur tes gardes ; elles se brisent quand la vie devient difficile.

Type 3 — les personnes racines : les plus importantes de ta vie ; elles sont toujours là quoi qu'il arrive, elles t'aiment tel que tu es.`,
      },
    ],
  },
  {
    id: 'respect-limites',
    title: 'Respect de soi et fixation de limites',
    items: [
      {
        title: 'Ne plus supplier, se respecter',
        body: `Commence à te respecter en tournant le dos à ceux qui t'ignorent. Ne supplie plus personne pour avoir une place dans sa vie. Apprends à garder pour toi ce qui n'a pas besoin d'être dit.

Quand quelqu'un te manque de respect, ne laisse pas passer. Fais-lui comprendre que tu n'es pas à vendre. Ne sois pas toujours celui qui donne pendant que les autres prennent.

Investis ton temps, ton énergie et ton argent en toi-même, parce que personne ne le fera à ta place. Souviens-toi : ce que tu dis reflète ce que tu es.`,
      },
      {
        title: 'Comment se faire respecter',
        body: `1. Arrête de courir après les gens. Un diamant est recherché, pas chassé.
2. Parle quand c'est nécessaire.
3. Cesse de mendier. Si tu n'es pas invité, ne demande pas à venir.
4. Lorsque les gens te manquent de respect, confronte-les immédiatement.
5. Ne mange pas plus dans l'assiette des autres qu'ils ne mangent dans la tienne.
6. Considère ceux qui te montrent de l'amour et oublie l'existence des idiots.
7. Habille-toi de la façon dont tu veux être traité.`,
      },
      {
        title: 'Fixer ses limites malgré sa générosité',
        body: `La patience est une qualité précieuse, et tu ne devrais pas laisser les autres la tester sans fin. Tu es quelqu'un de généreux, de serviable — mais il est important que tu penses aussi à toi.

Ta gentillesse ne devrait pas être exploitée. Tu mérites d'être traité avec respect et considération, et ceux qui essaient de profiter de toi ne méritent pas ton amitié.

Tu n'as pas à tolérer le manque de respect ou l'abus. Reste fidèle à toi-même, et n'aie pas peur de mettre des limites quand c'est nécessaire.`,
      },
      {
        title: 'Sept avantages à garder sa vie privée',
        body: `1. Moins tu partages, moins il y a de chances que les gens s'immiscent dans tes affaires.
2. Tu cesseras de te préoccuper de l'opinion des autres sur ta vie.
3. En construisant en silence, les gens auront moins de choses sur lesquelles t'attaquer.
4. Tu n'auras plus besoin de chercher la validation des autres.
5. Tu attireras davantage de paix dans ta vie.
6. Il sera plus facile de parcourir certains chemins seul.
7. Tu apprendras à être seul sans te sentir seul.`,
      },
      {
        title: "Cinq attitudes de présence et d'autorité",
        body: `1. Lorsque tu t'assois, tiens-toi ouvert et détendu.
2. Lorsque tu parles, dis aux gens ce que tu penses vraiment.
3. Lorsque tu marches, tiens-toi droit comme un roi.
4. Lorsque quelqu'un te manque de respect, reste calme, fixe-le droit dans les yeux.
5. Tout le monde ne mérite pas ton attention — apprends à ignorer les gens.`,
      },
      {
        title: 'Réponses face à la colère et à l\u2019irrespect',
        body: `Ne mets pas ma patience à l'épreuve — je peux être la personne la plus gentille et la plus douce que tu aies jamais rencontrée, mais lorsque ma limite est atteinte, tu me verras faire des choses dont personne ne m'imaginait capable.`,
      },
      {
        title: 'Trois façons de répondre à quelqu\u2019un qui te rabaisse',
        body: `1. Fais-lui répéter — dis calmement « j'ai besoin que tu répètes ça » ; il n'obtient pas la réaction attendue.
2. Retourne la situation avec des questions d'intention : « tu voulais que ça me blesse ? »
3. Peu importe ce qu'il dit, ne réponds pas — laisse ton silence être ta réponse.`,
      },
    ],
  },
  {
    id: 'verites-discipline',
    title: 'Vérités dures sur la vie et discipline',
    items: [
      {
        title: "Quatorze vérités que personne ne t'enseignera à l'école",
        body: `1. Personne ne viendra te sauver.
2. Ton boss ne t'enrichira jamais.
3. La motivation ment, la discipline gagne.
4. Le confort est un piège.
5. Les idées sans action ne valent rien.
6. Tous ceux que tu tolères se répètent.
7. L'argent ne change pas les gens, il révèle leur vraie personnalité.
8. Tes émotions contrôlent tes décisions.
9. Les diplômes ne garantissent rien.
10. Le confort est un piège.
11. Le travail dur ne suffit pas.
12. Les regrets pèsent plus que les échecs.
13. Ta vie change quand tu changes ton cercle.
14. Personne ne croira en toi jusqu'à ce que tu réussisses.`,
      },
      {
        title: 'Cinq règles à connaître avant trente ans',
        body: `1. Tout ne se passera pas toujours comme prévu — sois toujours prêt à t'adapter.
2. Tu deviens une force puissante lorsque tu réalises que tu peux réussir seul.
3. Sois à l'aise avec le fait que tout le monde ne t'appréciera pas.
4. Si tu veux construire quelque chose de valable, prépare-toi à recevoir des critiques.
5. Peu importe la lenteur de ta progression, tant que tu ne t'arrêtes pas, tu y arriveras.`,
      },
      {
        title: 'Sept erreurs qui empêchent de réussir',
        body: `1. Attendre le moment parfait — il n'arrivera jamais.
2. Passer plus de temps à réfléchir qu'à agir.
3. Vouloir tout savoir avant de commencer.
4. Abandonner dès que les premiers résultats tardent à arriver.
5. Laisser la peur du regard des autres décider à ta place.
6. Croire que tu as encore le temps.
7. Penser que ceux qui réussissent sont simplement plus intelligents — la plupart du temps, ils ont juste été plus constants.`,
      },
      {
        title: 'Sept signes que tu perds ton temps',
        body: `1. Tu attends toujours lundi pour commencer.
2. Tu regardes plus de vidéos que tu ne passes à l'action.
3. Tu cherches encore la méthode parfaite.
4. Tu laisses les avis des autres décider pour toi.
5. Tu repousses les décisions importantes.
6. Tu confonds être occupé avec être productif.
7. Tu termines chaque journée avec la sensation d'avoir été occupé sans avoir vraiment avancé.`,
      },
      {
        title: 'Sept décisions qui peuvent changer ta vie',
        body: `1. Arrêter d'attendre l'approbation des autres.
2. Investir davantage dans ses compétences que dans son apparence.
3. Choisir la constance plutôt que la perfection.
4. Accepter de commencer petit.
5. Apprendre à dire non à ce qui te fait perdre du temps.
6. Comprendre que ton futur dépend davantage de tes habitudes quotidiennes que de tes grandes ambitions.
7. Commencer aujourd'hui, parce que demain sera toujours plus facile à repousser.`,
      },
      {
        title: "Vérités difficiles sur l'école",
        body: `1. Le temps est plus précieux que l'argent.
2. Les meilleures notes ne garantissent pas la meilleure vie.
3. Les opportunités récompensent ceux qui passent à l'action.
4. L'échec n'est pas l'opposé de la réussite.
5. Personne ne viendra changer ta vie à ta place.
6. L'école t'apprend à réussir les examens, la vie t'apprend à avancer malgré les échecs.
7. Savoir résoudre des problèmes est une richesse.
8. La discipline vaut souvent plus que la motivation.`,
      },
      {
        title: 'Dix phrases pour changer sa vision',
        body: `1. Chaque échec est une opportunité d'apprendre et de grandir.
2. Le changement commence par une décision de ne plus accepter ceux qui ne te rendent pas heureux.
3. Le succès ne consiste pas à ne jamais tomber, mais à se relever à chaque fois.
4. Arrête de tout dire à tout le monde.
5. Sois reconnaissant pour ce que tu as maintenant tout en travaillant pour ce que tu veux.
6. Choisis tes amis avec soin.
7. La vie est trop courte pour être préoccupé par ce que pensent les autres.
8. La seule limite à la réalisation de tes rêves est celle que tu imposes à ton esprit.
9. Chaque jour est une nouvelle opportunité de devenir une meilleure version de toi-même.
10. Le bonheur ne se trouve pas au sommet de la montagne, mais dans la façon dont tu gravis chaque pas.`,
      },
      {
        title: 'Cinq phrases pour changer sa façon de penser',
        body: `1. Arrête de tout dire aux gens — apprends à discerner ce qui doit être partagé.
2. Choisis tes amis avec soin.
3. N'attends rien, apprécie tout.
4. Fais de ton mieux et fais confiance au processus.
5. Contrôle-toi toi-même, pas les autres.`,
      },
      {
        title: "Trois choses à accepter (maîtrise de soi, argent, temps)",
        body: `D'abord, la maîtrise de soi : atteins le point où ton humeur ne change pas en fonction des actions des autres.

Ensuite, arrête d'avoir peur de dépenser de l'argent pour de bons moments : ton temps sur cette planète est un cadeau — tu peux toujours récupérer de l'argent, mais tu ne peux pas récupérer le temps.

Enfin, dans trois générations, tout le monde qui te connaît sera mort, y compris les personnes dont les opinions t'ont empêché de faire ce que tu voulais depuis le début.`,
      },
      {
        title: 'Opinion des autres et limites mentales',
        body: `Le plus grand tueur de rêve est l'attachement à l'opinion des autres à propos de toi. La seule limite que tu as est celle que tu as toi-même créée dans ton esprit.

Comparer ta vie à celle de quelqu'un d'autre est le moyen le plus facile de devenir déprimé. Ce n'est pas le problème de revenus qui te rend fauché, c'est ton problème de dépense.`,
      },
      {
        title: 'Attente, bonheur et manière de vivre',
        body: `« Je me sens toujours heureux, parce que je n'attends rien de personne. » Les attentes font toujours mal. La vie est courte, alors aime ta vie, sois heureux et garde le sourire.

Avant de parler, écoute. Avant d'écrire, réfléchis. Avant de dépenser, gagne. Avant de prier, pardonne. Avant de blesser, ressens. Avant de haïr, aime. Avant d'abandonner, essaie. Avant de mourir, vis.`,
      },
    ],
  },
  {
    id: 'foi-perseverance',
    title: 'Foi, persévérance et dépassement de soi',
    items: [
      {
        title: "Peur de l'échec — exemples historiques (I)",
        body: `Tu penses que tu es trop jeune pour réussir ? Malala Yousafzai avait à peine 17 ans quand elle a reçu le prix Nobel de la paix.

Tu crois que tu es trop vieux ? Le colonel Sanders avait 65 ans quand il a lancé KFC.

Tu te dis que tu n'as pas assez d'argent ? Oprah Winfrey a grandi dans la pauvreté extrême, mais elle a bâti un empire en partant de zéro.

Tu crois que tu n'as pas les bonnes études ? Richard Branson a quitté l'école à 16 ans et a fondé Virgin.

Tu as peur de l'échec ? Michael Jordan a été viré de son équipe de basket au lycée.

Tu as peur d'être seul ? Thomas Edison a travaillé des années seul dans son laboratoire avant d'inventer l'ampoule.`,
      },
      {
        title: "Peur de l'échec — exemples historiques (II)",
        body: `Tu as peur d'échouer et que tout le monde se moque de toi ? Walt Disney craignait aussi que personne ne comprenne ses idées.

Tu n'as pas assez d'argent pour te lancer ? Steve Jobs a vendu sa Volkswagen pour 1500 dollars et a lancé Apple dans un garage.

Tu crois ne pas avoir les compétences ? Elon Musk n'avait aucune expérience lorsqu'il a fondé SpaceX.

Tu te sens seul, sans soutien ? J.K. Rowling a écrit le premier tome de Harry Potter en étant mère célibataire, sans aide, sans argent.`,
      },
      {
        title: 'Persévérance — ne jamais abandonner',
        body: `Tu n'as pas le droit de lâcher la vie. Elle va te mettre à genoux, elle va te faire croire que tu n'es pas assez fort — mais abandonner n'est pas une option.

Rappelle-toi : tu as déjà traversé pire et pourtant tu es encore là aujourd'hui. Les personnes qui finissent par réussir ne sont pas toujours les plus talentueuses, ce sont souvent celles qui refusent d'abandonner quand tout devient difficile.

Huit raisons de ne jamais abandonner : en persévérant tu atteins tes objectifs ; chaque défi surmonté te fait grandir ; ta détermination inspire les autres ; rester résolu renforce ton estime de toi ; tu augmentes tes chances de réussir ; tu découvres des chemins inattendus ; la persévérance t'apprend la patience ; la satisfaction finale est durable et gratifiante.`,
      },
      {
        title: "Ton chapitre n'est pas leur chapitre",
        body: `Tu vois peut-être ton chapitre 2 au chapitre 20 de quelqu'un d'autre — et c'est exactement ce qui te décourage. Tu regardes leurs résultats et tu ne vois jamais leurs années de travail, leurs erreurs, leurs sacrifices.

Alors arrête de courir la course des autres, construis la tienne à ton rythme — parce qu'au final, tu n'as pas besoin d'être meilleur que tout le monde, tu dois simplement être meilleur qu'hier.`,
      },
      {
        title: 'Recentrage et travail discret',
        body: `Imagine ce que tu pourrais construire si tu consacrais un peu moins d'énergie à répondre à chaque notification, à chaque invitation, à chaque discussion vide de sens.

On ne s'élève pas dans le bruit. Les plus grandes avancées naissent souvent dans des silences choisis. Pendant que certains enchaînent les scrolls, d'autres, en retrait, posent les fondations d'un actif qui travaille pour eux.`,
      },
      {
        title: 'Foi et discipline — bâtir son propre système',
        body: `La foi sans la discipline, c'est juste un rêve qui finit en frustration. Le plus beau cadeau n'est pas une bénédiction qui tombe du ciel sans effort — c'est l'intelligence de bâtir son propre système.

Le vrai amen, c'est quand tu arrêtes de subir ta vie pour devenir l'architecte de ta liberté. Dieu ouvre les portes, mais c'est à toi de franchir le seuil avec une structure solide.`,
      },
      {
        title: 'Foi, confiance et espoir — trois histoires',
        body: `1. Lors d'une prière pour la pluie, une seule personne vint avec un parapluie. C'est la foi.
2. Quand on lance un bébé en l'air, il rigole car il sait qu'on va le rattraper. C'est la confiance.
3. Chaque nuit, on se couche sans certitude du lendemain, pourtant on met toujours l'alarme. C'est l'espoir.

Vivons chaque jour comme si c'était le dernier, affrontons chaque épreuve avec confiance, et ayons toujours foi en nous-mêmes.`,
      },
      {
        title: 'Dieu donne ses plus durs combats à ses plus forts soldats',
        body: `Les épreuves et les obstacles sont nécessaires pour devenir celui que tu dois être. Les moments les plus difficiles sont en réalité ceux qui t'enseigneront le plus, et ceux qui te rendront le plus fort.`,
      },
      {
        title: 'Cinq déclarations pour sortir de la difficulté',
        body: `1. Lorsqu'il est effrayant de se jeter à l'eau, c'est exactement à ce moment-là qu'il faut le faire.
2. Si tu penses que le prix de la victoire est trop élevé, attends de recevoir la facture du regret.
3. La bravoure consiste à ressentir la peur et à aller de l'avant quoi qu'il en soit.
4. Personne ne croit en toi — mais tu continues à te dire que ce n'est pas fini tant que tu n'as pas gagné.
5. La meilleure version de toi est la version disciplinée — celle qui te dit non.`,
      },
      {
        title: "Transformation — l'histoire de l'aigle",
        body: `À 40 ans, l'aigle doit choisir : périr, ou entreprendre un changement radical — casser son bec sur un rocher, arracher ses griffes et ses plumes émoussées. Ce pénible voyage dure 150 jours, mais l'aigle émerge transformé, avec une nouvelle vie.

Parfois nous devons laisser derrière nous notre ancienne version pour laisser place à une nouvelle, meilleure et plus forte version de nous.`,
      },
    ],
  },
  {
    id: 'reussite-argent',
    title: 'Réussite, argent et mentalité',
    items: [
      {
        title: 'Mentalité riches vs pauvres',
        body: `1. Les pauvres regardent la télé pendant que les riches lisent des livres.
2. Les riches assument la responsabilité de leurs actions.
3. Les pauvres se concentrent sur l'épargne, les riches sur l'investissement.
4. Les riches apprennent en continu.
5. Les pauvres ont une mentalité de loterie, les riches une mentalité d'action.

Rien n'arrive par hasard. Les riches savent que s'ils veulent que quelque chose se produise, ils doivent en être les artisans.`,
      },
      {
        title: 'Six règles de réussite',
        body: `1. Si tout le monde est d'accord avec toi, tu es probablement en retard.
2. Les pauvres achètent des choses, les riches achètent du temps.
3. Concentre-toi sur une seule personne qui t'aidera à tout accomplir.
4. Un gagnant n'est qu'un perdant qui a essayé une fois de plus.
5. Quand tu deviens paresseux, rappelle-toi que c'est un manque de respect envers ceux qui croient en toi.
6. Six mois de constance, de discipline et de travail peuvent tout changer.`,
      },
      {
        title: 'Le monde a changé',
        body: `Le monde a changé beaucoup plus vite que les conseils qu'on nous a donnés. Internet a changé, l'IA a changé, le business a changé, mais beaucoup continuent d'appliquer des règles d'il y a trente ans, et ça ne fonctionne plus.`,
      },
      {
        title: 'Cinq lois utiles',
        body: `1. Loi de Murphy — plus tu crains quelque chose, plus cela arrivera.
2. Loi de Kurtland — si tu peux écrire clairement le problème, la moitié du travail est fait.
3. Loi de Gilbert — le plus grand problème au travail est que personne ne te dit quoi faire.
4. Loi de Wilson — si tu priorises l'information et l'intelligence, l'argent continuera à affluer.
5. Loi de Falkland — quand tu n'as pas à prendre de décision, ne prends pas de décision.`,
      },
      {
        title: "Pourquoi s'entourer de professionnels",
        body: `Un avocat te protège contre les litiges. Un comptable minimise tes impôts et maximise tes profits. Un banquier t'aide à obtenir des financements. Un notaire rédige tes documents juridiques importants. Les investisseurs partagent leur réseau et leurs conseils stratégiques.`,
      },
      {
        title: 'Comment parler comme un leader',
        body: `Au lieu de « je ne sais pas » → « laisse-moi m'informer ». Au lieu de « c'est impossible » → « cela semble peu réalisable ». Au lieu de « je suis désolé » → « mes excuses les plus sincères ». Au lieu de « c'est facile » → « c'est un jeu d'enfant ».`,
      },
      {
        title: 'Contenu, ambition et réussite (le 1%)',
        body: `Seulement 1% des personnes sont conscientes, déterminées à sortir de la misère, et nourrissent de grands rêves. Ce sont elles qui œuvrent avec rigueur et persévérance, qui continuent d'avancer malgré les échecs, qui se lèvent tôt même sans activité.`,
      },
    ],
  },
  {
    id: 'personnalite-intelligence',
    title: 'Signes de personnalité, intelligence et sensibilité',
    items: [
      {
        title: "Huit signes que tu n'es pas bête, mais juste incompris",
        body: `1. Tu remets en question ce qu'on t'impose.
2. Tu préfères la solitude à la médiocrité.
3. Tu ressens les émotions des autres.
4. Tu détestes les discussions superficielles.
5. Tu penses plus vite que tu ne parles.
6. Tu te sens souvent en marge, mais jamais à côté de la plaque.
7. Tu observes plus que tu ne t'exprimes.
8. Tu ressens une grande fatigue mentale sans raison apparente.`,
      },
      {
        title: 'Six habitudes des personnes ayant un QI élevé',
        body: `1. Elles se parlent à elles-mêmes.
2. Elles ont un grand sens de l'humour.
3. Elles aiment la solitude.
4. Elles sont ouvertes d'esprit.
5. Elles ont de grandes compétences d'observation.
6. Elles ne se plaignent pas — elles proposent des solutions.`,
      },
      {
        title: 'Dix signes que tu as évolué',
        body: `1. Tu es plus ouvert d'esprit.
2. Tu gères mieux le stress.
3. Tu fais preuve d'empathie.
4. Tu prends du recul régulièrement.
5. Tu es plus confiant face aux obstacles.
6. Tu as une vision plus claire de ton avenir.
7. Tu es plus résilient.
8. Tu prends soin de ton bien-être.
9. Tu valorises la tranquillité.
10. Tu prends la responsabilité de tes actions.`,
      },
      {
        title: 'Cinq secrets psychologiques',
        body: `1. Se comparer constamment aux autres = faible estime de soi.
2. Chercher toujours l'attention = besoin d'être aimé et accepté.
3. Parler moins en public = donner de la valeur à ses mots.
4. Vouloir toujours être parfait = crainte du jugement des autres.
5. Être attentif aux autres mais pas à soi = peur d'être perçu comme égoïste.`,
      },
      {
        title: 'Cinq signes de traumatisme méconnus',
        body: `1. Remercier trop quand quelqu'un est gentil.
2. S'excuser même sans avoir rien fait de mal.
3. Ne pas se souvenir de son enfance — le cerveau protège.
4. Ne pas accepter les compliments.
5. Ne jamais demander d'aide, habitué à tout gérer seul.

Note : si tu te reconnais dans ces signes, il est recommandé d'en parler à un professionnel de santé mentale plutôt que de se fier uniquement à du contenu en ligne.`,
      },
      {
        title: 'Le jugement des autres — tu ne peux pas gagner',
        body: `Si tu prends du poids, on dit que tu manges trop. Si tu en perds, on dit que tu es malade. Si tu réussis, tu es arrogant. Si tu as des difficultés, on dit que tu es paresseux.

Peu importe ce que tu fais dans la vie, ils trouveront toujours quelque chose à dire. Alors fais ce qui te comble et te rend heureux.`,
      },
    ],
  },
  {
    id: 'routines-discipline',
    title: 'Routines, habitudes et discipline quotidienne',
    items: [
      {
        title: 'Sept rituels matinaux pour devenir ultra performant',
        body: `1. Ne check pas ton téléphone au réveil.
2. Bouge ton corps dès les premières minutes.
3. Pose une intention claire pour la journée.
4. Visualise ton succès futur.
5. Prends une douche froide.
6. Lis quelques pages pour évoluer.
7. Ne négocie jamais avec ton réveil.`,
      },
      {
        title: 'Sept choses à faire avant 7 heures du matin',
        body: `1. Bois de l'eau dès ton réveil.
2. Éloigne-toi de ton téléphone.
3. Fais de l'exercice pendant 30 minutes.
4. Médite pendant 15 minutes.
5. Lis 10 pages d'un livre de développement personnel.
6. Fixe-toi des objectifs pour la journée.
7. Prends une douche froide, de préférence avant de manger.`,
      },
      {
        title: 'Cinq techniques japonaises pour vaincre la paresse',
        body: `1. Ikigai — découvre ton but dans la vie.
2. Kaizen — de petites améliorations chaque jour.
3. Hara hachi bu — arrête de manger à 80% de satiété.
4. Shoshin — approche chaque tâche comme un débutant.
5. Wabi-sabi — accepte l'imperfection ; agir vaut mieux qu'attendre la perfection.`,
      },
    ],
  },
  {
    id: 'detachement-paix',
    title: 'Détachement, lâcher-prise et paix intérieure',
    items: [
      {
        title: 'S\u2019éloigner de ceux qui ne te valorisent pas',
        body: `La vie est trop courte pour se réveiller avec des regrets. Aime les personnes qui te traitent bien, et oublie celles qui ne le font pas.

Apprends à t'éloigner des personnes qui ne voient pas ta valeur. Remercie l'heure de t'avoir appris que tu ne peux compter que sur toi-même, et maintenant vis selon tes propres règles.`,
      },
      {
        title: 'Lâcher prise / accepter ce qui vient',
        body: `Ne force rien, tout ce qui doit arriver arrivera. Il n'y a pas de bonnes ou mauvaises décisions : ceux qui doivent faire partie de ta vie en feront partie, et les autres disparaîtront un jour.

Apprends à lâcher prise, à accepter que certaines choses, certaines personnes, ne sont pas destinées à rester dans ta vie.`,
      },
      {
        title: 'Six règles qui changent une vie',
        body: `1. Laisse aller — ne ruine jamais une bonne journée en pensant à une mauvaise hier.
2. Ignore-les — vis une vie qui t'apporte épanouissement.
3. Donne-toi du temps — sois patient avec toi-même.
4. Ne te compare pas — bats seulement la personne que tu étais hier.
5. Reste calme — c'est normal de ne pas tout comprendre.
6. Tu es l'unique responsable de ton bonheur.`,
      },
      {
        title: 'Rejet, détachement et contrôle de soi',
        body: `Accepte le rejet si tu n'es pas aimé, laisse partir. Tous ceux que tu aimes ne resteront pas ; tout le monde en qui tu as confiance ne sera pas loyal.

Tu ne pourras peut-être pas contrôler chaque situation et son résultat, mais tu peux contrôler ton attitude et la manière dont tu y fais face.`,
      },
      {
        title: 'Six moments où il faut garder ses distances',
        body: `1. Quand les discussions deviennent tendues ou conflictuelles.
2. Quand ta présence n'est pas désirée.
3. Quand quelqu'un exprime un besoin d'intimité ou de solitude.
4. Quand ta participation pourrait étouffer la voix des autres.
5. Quand ta présence pourrait déranger l'harmonie d'un moment privé.
6. Quand tu identifies un besoin de réflexion individuelle chez l'autre.`,
      },
      {
        title: 'Maturité et paix intérieure',
        body: `La maturité, c'est se rendre compte que l'on ne veut plus être entouré de drame, de stress ou de conflit. On commence à préférer le calme au chaos, et la distance au manque de respect.`,
      },
      {
        title: 'Gestion des émotions et de la colère',
        body: `Lorsque tu es en colère, reste silencieux. Ne perds pas ton temps avec des explications — les gens n'entendent que ce qu'ils veulent entendre. Accepte les critiques, mais n'accepte jamais le manque de respect.

Il vaut mieux pleurer que se mettre en colère, car la colère blesse les autres, tandis que les larmes purifient le cœur.`,
      },
    ],
  },
  {
    id: 'gratitude',
    title: 'Gratitude et relativisation',
    items: [
      {
        title: 'Le conseil de Warren Buffett',
        body: `1. Le travail qui te fatigue est le rêve de quelqu'un qui cherche encore une opportunité.
2. La maison qui te semble trop petite est le rêve de quelqu'un qui dort dehors.
3. Les problèmes que tu trouves énormes seraient une bénédiction pour quelqu'un d'autre.
4. Les erreurs que tu regrettes sont des leçons que beaucoup n'auront jamais la chance d'apprendre.
5. Le temps que tu gaspilles aujourd'hui est un trésor pour ceux qui n'en ont plus.

La vraie richesse, c'est savoir apprécier ce que tu as avant de le perdre.`,
      },
      {
        title: 'Jackie Chan — la relativité du bonheur',
        body: `Le travail difficile dont vous vous plaignez est le rêve de quelqu'un au chômage. La maison que vous trouvez trop petite est le rêve d'un sans-abri. La paix intérieure, le sommeil réparateur et l'accès facile à la nourriture sont des luxes inaccessibles pour ceux qui vivent dans des zones de conflit.`,
      },
    ],
  },
  {
    id: 'citations-sagesses',
    title: 'Citations et sagesses',
    items: [
      {
        title: 'Neuf citations de penseurs célèbres',
        body: `Sénèque : nous souffrons plus dans notre imagination que dans la réalité.
George Eliot : il n'est jamais trop tard pour devenir ce que l'on aurait pu être.
Marc Aurèle : notre vie est ce que nos pensées en font.
Carl Jung : penser est difficile, c'est pourquoi la plupart des gens jugent.
Épictète : si tu te soucies de ce que pensent les autres, tu seras toujours leur prisonnier.
Pythagore : un sot se reconnaît à ses paroles, et un sage par son silence.
Confucius : si tu es la personne la plus intelligente dans la pièce, tu es dans la mauvaise pièce.
Rumi : plus tu deviens silencieux, plus tu es capable d'entendre.`,
      },
      {
        title: 'Charlie Chaplin — quatre déclarations pour une vie saine',
        body: `1. Rien n'est éternel dans ce monde, pas même nos problèmes.
2. J'aime marcher sous la pluie, parce que personne ne peut voir mes larmes.
3. Le jour le plus perdu dans la vie est le jour où l'on ne rit pas.
4. Les six meilleurs médecins au monde sont le soleil, le repos, l'exercice, l'alimentation, le respect de soi et les amis.`,
      },
      {
        title: "L'histoire de Thomas Edison et de sa mère",
        body: `Edison retrouva, après la mort de sa mère, une lettre de son professeur disant : « votre fils est attardé mentalement, nous ne le laisserons plus venir à l'école. » Sa mère lui avait toujours dit qu'il était un génie que l'école ne méritait pas.

Morale : ne laisse jamais l'opinion des autres déterminer ce que tu peux devenir.`,
      },
      {
        title: 'La vie expliquée par le chien, le singe, la vache et l\u2019homme',
        body: `Pendant nos vingt premières années nous mangeons, dormons et nous amusons ; pendant les quarante années suivantes nous travaillons dur pour soutenir notre famille ; pendant les dix années suivantes nous divertissons nos enfants ; et pour les dix dernières années, nous nous asseyons sur le porche et aboyons sur tout le monde.`,
      },
      {
        title: 'Leçons des loups',
        body: `Les loups ne s'accouplent pas avec leur mère ou leur sœur. En cas de décès du conjoint, le loup reste en deuil pendant au moins trois mois. Le loup honore ses parents âgés en chassant pour eux. En tant qu'humains, nous avons beaucoup à apprendre des loups.`,
      },
    ],
  },
];
