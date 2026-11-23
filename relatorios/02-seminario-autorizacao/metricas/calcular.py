import collections
import csv
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REPO = ROOT.parents[1]
CATALOG = ROOT / "planejamento/casos-autorizacao.csv"
LEDGER = ROOT / "metricas/registro-execucao.csv"
REPORT = REPO / "educado-security-tests/relatorio-de-execucao.md"
OUT_JSON = ROOT / "metricas/metricas-obsv.json"
OUT_MD = ROOT / "fontes/05-resultados-metricas.md"

PENDING = {"P06", "P07", "P08", "P09", "P10", "P11"}
REUSED_SUBCASES = {
    "AT-19.1": {"AT-04-N2"},
    "AT-19.2": {"AT-04-N4"},
}
EXECUTED = {"aprovado", "reprovado"}
STATUS = EXECUTED | {"ignorado"}
SENSITIVE_FIELDS = ("ownerId", "role", "userId", "correctAnswer")
ASVS_ALL = (
    "8.1.1", "8.1.2", "8.2.1", "8.2.2", "8.2.3", "8.3.1", "8.3.2", "8.4.1"
)
ASVS_DOCUMENTED = {
    "8.1.1": "relatorios/02-seminario-autorizacao/fontes/05-metricas-educado.md#6-rastreabilidade-ao-owasp-asvs",
    "8.1.2": "relatorios/02-seminario-autorizacao/fontes/05-metricas-educado.md#6-rastreabilidade-ao-owasp-asvs",
}
ASVS_LIMITS = {
    "8.1.1": "Regra documentada; não há requisição HTTP que prove atendimento.",
    "8.1.2": "Campos sensíveis inventariados; escrita/leitura negada não executada.",
    "8.2.1": "Execução parcial por papel; parte depende de P06/P07.",
    "8.2.2": "Execução parcial; duas leituras não publicadas falharam.",
    "8.2.3": "Exposição de gabarito observada; demais campos não testados.",
    "8.3.1": "Chamadas diretas à API; respostas parciais não provam allowlist.",
    "8.3.2": "Subcasos de sessão bloqueados por P09.",
    "8.4.1": "Subcaso institucional bloqueado por P11; CRUD por papel não substitui tenant.",
}


def read_csv(path):
    with path.open(encoding="utf-8", newline="") as stream:
        return list(csv.DictReader(stream))


def require(condition, message):
    if not condition:
        raise ValueError(message)


def report_counts():
    counts = {}
    for line in REPORT.read_text(encoding="utf-8").splitlines():
        match = re.match(r"^\| (AT-\d{2}) \| (\d+) \| (\d+) \| (\d+) \| (\d+) \|$", line)
        if match:
            case, found, approved, failed, skipped = match.groups()
            counts[case] = {
                "encontrados": int(found),
                "aprovado": int(approved),
                "reprovado": int(failed),
                "ignorado": int(skipped),
            }
    require(len(counts) == 23, "A tabela por AT do relatório de execução está incompleta")
    return counts


def normalize_endpoint(endpoint):
    return re.sub(r"\{[^}]+\}", "{}", endpoint)


def endpoint_family(endpoint):
    parts = endpoint.strip("/").split("/")
    return parts[0] if parts else "-"


def object_condition(row):
    state = row["recurso_estado"].lower()
    case = row["id"]
    if "inexistente" in state or "{x}" in (row["endpoint"] + row["payload"]).lower():
        return "inexistente"
    if "alheio" in state or "outro" in state or " de u2" in state or " de b" in state:
        return "alheio"
    if "-p" in case.lower() or "próprio" in state or "própria" in state or " de u1" in state or " de a" in state:
        return "próprio"
    return "outro"


def row_text(row):
    return " ".join(row.values())


def has_sensitive_field(row, field):
    pattern = rf"(?<![a-z0-9]){re.escape(field.lower())}(?![a-z0-9])"
    return re.search(pattern, row_text(row).lower()) is not None


def pct(numerator, denominator):
    if denominator == 0:
        return "não mensurável"
    return f"{numerator / denominator * 100:.1f}".replace(".", ",") + "%"


def metric(identifier, goal, numerator, denominator, interpretation, situation=None):
    if denominator is None:
        return {
            "id": identifier,
            "meta": goal,
            "numerador": numerator,
            "denominador": None,
            "observado": str(numerator),
            "situacao": situation or "medido",
            "interpretacao": interpretation,
        }
    measurable = denominator > 0
    return {
        "id": identifier,
        "meta": goal,
        "numerador": numerator,
        "denominador": denominator,
        "observado": pct(numerator, denominator) if measurable else "não mensurável",
        "situacao": situation or ("medido" if measurable else "não mensurável"),
        "interpretacao": interpretation,
    }


def build():
    catalog = read_csv(CATALOG)
    ledger = read_csv(LEDGER)
    by_id = {row["id"]: row for row in catalog}
    counts = report_counts()
    ledger_counts = {case: collections.Counter() for case in counts}
    for row in ledger:
        require(row["situacao"] in STATUS, f"{row['teste']}: situação inválida")
        require(row["subcasos"] != "-", f"{row['teste']}: sem subcaso associado")
        for subcase in row["subcasos"].split(";"):
            require(subcase in by_id, f"{row['teste']}: subcaso {subcase} ausente")
            same_parent = by_id[subcase]["caso_pai"] == row["caso_pai"]
            reused = subcase in REUSED_SUBCASES.get(row["teste"], set())
            require(same_parent or reused, f"{row['teste']}: caso pai divergente")
        ledger_counts[row["caso_pai"]]["encontrados"] += 1
        ledger_counts[row["caso_pai"]][row["situacao"]] += 1
    for case, expected in counts.items():
        actual = ledger_counts[case]
        require(
            all(actual[key] == expected[key] for key in ("encontrados", "aprovado", "reprovado", "ignorado")),
            f"{case}: ledger diverge do relatório de execução",
        )

    subcase_executions = collections.defaultdict(list)
    for row in ledger:
        if row["situacao"] in EXECUTED:
            for subcase in row["subcasos"].split(";"):
                subcase_executions[subcase].append(row)

    subcase_status = {}
    for subcase in by_id:
        executions = subcase_executions.get(subcase, [])
        statuses = {item["situacao"] for item in executions}
        if "reprovado" in statuses:
            subcase_status[subcase] = "reprovado"
        elif "aprovado" in statuses:
            subcase_status[subcase] = "aprovado"
        else:
            subcase_status[subcase] = "ignorado"

    rules = collections.defaultdict(list)
    for row in catalog:
        for rule in row["regra_id"].split(";"):
            rules[rule].append(row)
    applicable_rules = sorted({
        rule for rule, rows in rules.items()
        if any(item["status_definicao"] == "definido" for item in rows)
    })
    pending_rules = sorted(set(rules) - set(applicable_rules))
    require(set(pending_rules) == PENDING, f"Regras pendentes divergentes: {pending_rules}")

    pairs = {}
    objects = set()
    for row in catalog:
        if row["status_definicao"] != "definido" or row["endpoint"].startswith("PENDENTE"):
            continue
        pair = f"{row['metodo']} {normalize_endpoint(row['endpoint'])}"
        pairs[pair] = row
        condition = object_condition(row)
        if condition != "outro":
            objects.add(f"{endpoint_family(row['endpoint'])}:{condition}")

    executed_subcases = sorted(subcase_executions)
    executed_pairs = set()
    executed_objects = set()
    for subcase in executed_subcases:
        row = by_id[subcase]
        if row["endpoint"].startswith("PENDENTE"):
            continue
        executed_pairs.add(f"{row['metodo']} {normalize_endpoint(row['endpoint'])}")
        condition = object_condition(row)
        if condition != "outro":
            executed_objects.add(f"{endpoint_family(row['endpoint'])}:{condition}")

    field_catalog = {}
    for field in SENSITIVE_FIELDS:
        rows = [row for row in catalog if has_sensitive_field(row, field) and row["status_definicao"] == "definido"]
        if rows:
            field_catalog[field] = rows
    executed_fields = {
        field: [row for row in rows if subcase_status[row["id"]] in EXECUTED]
        for field, rows in field_catalog.items()
    }
    fields_complete = sorted(
        field for field, rows in executed_fields.items()
        if any("-p" in row["id"].lower() for row in rows)
        and any("-n" in row["id"].lower() or "-c" in row["id"].lower() for row in rows)
    )

    rule_complete = []
    rule_exercised = []
    for rule in applicable_rules:
        rows = rules[rule]
        positive_ok = any(
            "-p" in row["id"].lower() and subcase_status[row["id"]] == "aprovado" for row in rows
        )
        negative_ok = any(
            "-n" in row["id"].lower() and subcase_status[row["id"]] in EXECUTED for row in rows
        )
        if positive_ok and negative_ok:
            rule_exercised.append(rule)
        positive_full = any(
            "-p" in row["id"].lower()
            and any(item["abrangencia"] == "completa" for item in subcase_executions.get(row["id"], []))
            for row in rows
        )
        negative_full = any(
            "-n" in row["id"].lower()
            and any(item["abrangencia"] == "completa" for item in subcase_executions.get(row["id"], []))
            for row in rows
        )
        if positive_full and negative_full:
            rule_complete.append(rule)

    executed_rows = [row for row in ledger if row["situacao"] in EXECUTED]
    negative_rows = [
        row for row in executed_rows
        if all("-n" in sub.lower() or "-c" in sub.lower() for sub in row["subcasos"].split(";"))
    ]
    positive_rows = [
        row for row in executed_rows
        if any("-p" in sub.lower() for sub in row["subcasos"].split(";"))
        and not any("-n" in sub.lower() or "-c" in sub.lower() for sub in row["subcasos"].split(";"))
    ]
    failures = [row for row in executed_rows if row["situacao"] == "reprovado"]
    severity_counts = collections.Counter(row["severidade"] for row in failures)

    catalog_asvs = sorted({item.strip() for row in catalog for item in row["asvs"].split(";") if item.strip()})
    planned_asvs = sorted(set(catalog_asvs) | set(ASVS_DOCUMENTED))
    require(planned_asvs == list(ASVS_ALL), f"ASVS planejado divergente: {planned_asvs}")
    executed_asvs = sorted({
        item.strip()
        for subcase in executed_subcases
        for item in by_id[subcase]["asvs"].split(";")
        if item.strip()
    })

    matrix = []
    for requirement in ASVS_ALL:
        related = [row for row in catalog if requirement in row["asvs"].split(";")]
        executions = [
            row for row in ledger
            if any(
                requirement in by_id[subcase]["asvs"].split(";")
                for subcase in row["subcasos"].split(";")
            )
        ]
        evidence = []
        for row in executions:
            if row["situacao"] in EXECUTED and row["evidencia"] not in evidence:
                evidence.append(row["evidencia"])
        if not related:
            evidence.append(ASVS_DOCUMENTED[requirement])
        status_counts = collections.Counter(row["situacao"] for row in executions)
        matrix.append({
            "requisito": requirement,
            "subcasos_planejados": len(related) if related else "documental",
            "testes_executados": status_counts["aprovado"] + status_counts["reprovado"],
            "aprovados": status_counts["aprovado"],
            "reprovados": status_counts["reprovado"],
            "ignorados": status_counts["ignorado"],
            "evidencias": evidence,
            "interpretacao": ASVS_LIMITS[requirement],
        })

    metrics = [
        metric("cobertura_regras", "100%", len(rule_exercised), len(applicable_rules),
               "Regras com controle positivo aprovado e tentativa negativa executada; todas as execuções são parciais."),
        metric("cobertura_regras_validada", "100%", len(rule_complete), len(applicable_rules),
               "Contagem rigorosa com verificação de dados e efeitos nos dois lados."),
        metric("cobertura_funcoes", "100%", len(executed_pairs & set(pairs)), len(pairs),
               "Pares método–endpoint únicos efetivamente exercitados; repetições não aumentam o numerador."),
        metric("cobertura_objetos", "100%", len(executed_objects & objects), len(objects),
               "Combinações família de endpoint × próprio/alheio/inexistente efetivamente exercitadas."),
        metric("cobertura_campos", "100%", len(fields_complete), len(field_catalog),
               "Campos sensíveis com leitura ou escrita permitida e negada executadas."),
        metric("negacoes_bloqueadas", "100%", sum(row["abrangencia"] == "completa" for row in negative_rows), len(negative_rows),
               "Sem verificação de dado/efeito nas aprovações parciais; 0 não significa negação incorreta."),
        metric("bypasses", "0", len(failures), None,
               "Três acessos indevidos confirmados no registro de execução; nenhuma escrita indevida foi executada."),
        metric("falsos_positivos", "0%", sum(row["situacao"] == "reprovado" for row in positive_rows), len(positive_rows),
               "Controles legítimos executados e aprovados com verificação parcial de dados."),
        metric("integridade_pos_negacao", "100%", 0, 0,
               "Nenhuma negação executada registrou estado antes/depois; denominador zero não vira 100%."),
        metric("rastreabilidade_planejada", "100%", len(planned_asvs), len(ASVS_ALL),
               "Todos os requisitos selecionados têm rastreio documental; 8.1.1 e 8.1.2 são documentais."),
        metric("rastreabilidade_executada", "informativa", len(executed_asvs), len(ASVS_ALL),
               "Requisitos com ao menos uma requisição executada e evidência referenciada."),
        metric("severidade", "zero críticas/altas abertas", severity_counts["critica"] + severity_counts["alta"], None,
               "Falhas confirmadas no registro de execução; ausência de teste não conta como ausência de falha."),
    ]

    return {
        "fontes": {
            "catalogo": "relatorios/02-seminario-autorizacao/planejamento/casos-autorizacao.csv",
            "ledger": "relatorios/02-seminario-autorizacao/metricas/registro-execucao.csv",
            "relatorio": "educado-security-tests/relatorio-de-execucao.md",
            "suíte": "educado-security-tests/tests",
        },
        "contagens": {
            "subcasos_planejados": len(catalog),
            "subcasos_definidos": sum(row["status_definicao"] == "definido" for row in catalog),
            "subcasos_bloqueados": sum(row["status_definicao"] == "bloqueado" for row in catalog),
            "testes_descobertos": sum(item["encontrados"] for item in counts.values()),
            "testes_aprovados": sum(item["aprovado"] for item in counts.values()),
            "testes_reprovados": sum(item["reprovado"] for item in counts.values()),
            "testes_ignorados": sum(item["ignorado"] for item in counts.values()),
            "subcasos_executados": len(executed_subcases),
            "subcasos_so_ignorados": sum(
                subcase not in subcase_executions for subcase in by_id
            ),
            "regras_aplicaveis": applicable_rules,
            "regras_pendentes": pending_rules,
            "regras_exercitadas": rule_exercised,
            "regras_validadas": rule_complete,
            "pares_metodo_endpoint_aplicaveis": sorted(pairs),
            "pares_executados": sorted(executed_pairs & set(pairs)),
            "combinacoes_objeto_aplicaveis": sorted(objects),
            "combinacoes_objeto_executadas": sorted(executed_objects & objects),
            "campos_sensiveis": sorted(field_catalog),
            "campos_completicos": fields_complete,
            "negacoes_executadas": len(negative_rows),
            "negacoes_com_status_esperado": sum(row["situacao"] == "aprovado" for row in negative_rows),
            "controles_positivos_executados": len(positive_rows),
            "severidade": dict(severity_counts),
            "asvs_no_catalogo": catalog_asvs,
            "asvs_documentais": sorted(ASVS_DOCUMENTED),
            "asvs_executados": executed_asvs,
        },
        "metricas": metrics,
        "falhas": [
            {
                "teste": row["teste"],
                "subcasos": row["subcasos"].split(";"),
                "severidade": row["severidade"],
                "evidencia": row["evidencia"],
                "observacao": row["observacao"],
            }
            for row in failures
        ],
        "matriz_asvs": matrix,
        "limitacoes": [
            "O relatório de #27 não informa commit da API, BASE_URL, timestamp por teste nem duração por requisição.",
            "Os arquivos playwright-report e test-results não estão versionados; três falhas têm apenas o caminho do error-context no registro.",
            "Nenhum teste executado verificou estado antes/depois; integridade after denial permanece não mensurável.",
            "A asserção de AT-10 foi alterada após a rodada de 42 testes; repetir a suíte é necessário para validar a nova forma.",
            "P06–P11 permanecem sem decisão aprovada; casos bloqueados não entram em denominadores de regras aplicáveis.",
            "A revisão por colega dos cálculos ainda não foi registrada; a PR deve solicitar essa conferência.",
        ],
    }


def markdown_table(headers, rows):
    lines = ["| " + " | ".join(headers) + " |", "|" + "|".join("---" for _ in headers) + "|"]
    lines.extend("| " + " | ".join(str(cell) for cell in row) + " |" for row in rows)
    return "\n".join(lines)


def render(data):
    counts = data["contagens"]
    lines = [
        "# Resultados observados das métricas",
        "",
        "Os valores abaixo vêm do catálogo de #25 e do registro de #27.",
        "Nenhum percentual é inferido de planejamento, hipótese ou teste ignorado.",
        "",
        "## 1. Fontes e regra de contagem",
        "",
        markdown_table(
            ["Fonte", "Uso"],
            [
                ["`planejamento/casos-autorizacao.csv`", "Inventário de 149 subcasos, regras, ASVS e estado de definição"],
                ["`metricas/registro-execucao.csv`", "Associação entre 42 testes da suíte e subcasos; situação e evidência"],
                ["`educado-security-tests/relatorio-de-execucao.md`", "Contagens por AT, falhas observadas e limitações"],
                ["`metricas/calcular.py`", "Cálculo reproduzível; gera este arquivo e `metricas/metricas-obsv.json`"],
            ],
        ),
        "",
        "Cada execução de teste registrada conta uma tentativa; AT-04.2 e AT-19.1 são repetições distintas do mesmo par.",
        "A cobertura de funções usa pares método–endpoint únicos, com `{...}` normalizado para `{}`.",
        "Aplicam-se apenas subcasos `definido` aos denominadores de regras, funções, objetos e campos;",
        "os 32 subcasos `bloqueado` e os testes `ignorado` não contam como aprovados nem como cobertura exercitada.",
        "Denominador zero é informado como não mensurável, sem converter ausência de verificação em sucesso.",
        "",
        "## 2. Inventários e volume executado",
        "",
        markdown_table(
            ["Item", "Inventário aplicável", "Executado"],
            [
                ["Subcasos", f"{counts['subcasos_definidos']} definidos de {counts['subcasos_planejados']} planejados", counts["subcasos_executados"]],
                ["Regras", f"{len(counts['regras_aplicaveis'])} aplicáveis; {len(counts['regras_pendentes'])} pendentes", len(counts["regras_exercitadas"])],
                ["Pares método–endpoint", len(counts["pares_metodo_endpoint_aplicaveis"]), len(counts["pares_executados"])],
                ["Combinações de objeto", len(counts["combinacoes_objeto_aplicaveis"]), len(counts["combinacoes_objeto_executadas"])],
                ["Campos sensíveis", ", ".join(counts["campos_sensiveis"]), ", ".join(counts["campos_completicos"]) or "nenhum"],
            ],
        ),
        "",
        f"Regras aplicáveis: {', '.join(counts['regras_aplicaveis'])}.",
        f"Pendentes sem oráculo aprovado: {', '.join(counts['regras_pendentes'])}.",
        f"Testes descobertos: {counts['testes_descobertos']}; aprovados: {counts['testes_aprovados']};",
        f"reprovados: {counts['testes_reprovados']}; ignorados: {counts['testes_ignorados']}.",
        f"AT-12 não teve teste descoberto; {counts['subcasos_so_ignorados']} dos {counts['subcasos_planejados']} subcasos planejados não receberam execução registrada, inclusive os {counts['subcasos_bloqueados']} bloqueados.",
        "",
        "## 3. Meta proposta × valor observado",
        "",
        markdown_table(
            ["Métrica", "Meta", "Numerador", "Denominador", "Observado", "Interpretação"],
            [
                [item["id"], item["meta"], item["numerador"], item["denominador"] if item["denominador"] is not None else "—", item["observado"], item["interpretacao"]]
                for item in data["metricas"]
            ],
        ),
        "",
        f"Das {counts['negacoes_executadas']} tentativas negativas executadas,",
        f"{counts['negacoes_com_status_esperado']} tiveram status de negação esperado, mas nenhuma verificou dado ou efeito.",
        f"Os {counts['controles_positivos_executados']} controles legítimos executados falharam em nenhum caso.",
        "As três falhas são desvios válidos para contagem de falhas, não ausência comprovada em casos não executados.",
        "",
        "## 4. Falhas confirmadas e severidade",
        "",
        markdown_table(
            ["Teste", "Subcasos", "Severidade", "Evidência", "Desvio"],
            [
                [item["teste"], "; ".join(item["subcasos"]), item["severidade"], f"`{item['evidencia']}`", item["observacao"]]
                for item in data["falhas"]
            ],
        ),
        "",
        "Severidade agregada: " + ", ".join(
            f"{level}: {amount}" for level, amount in sorted(counts["severidade"].items())
        ) + ".",
        "A classificação usa o impacto descrito no registro de #27; nenhuma falha é atribuída a teste não executado.",
        "",
        "## 5. Matriz ASVS: planejamento → execução → evidência",
        "",
        markdown_table(
            ["Requisito", "Subcasos planejados", "Executados", "Aprovados", "Reprovados", "Ignorados", "Evidência", "Interpretação"],
            [
                [
                    item["requisito"], item["subcasos_planejados"], item["testes_executados"],
                    item["aprovados"], item["reprovados"], item["ignorados"],
                    ", ".join(f"`{path}`" for path in item["evidencias"]) or "sem execução",
                    item["interpretacao"],
                ]
                for item in data["matriz_asvs"]
            ],
        ),
        "",
        f"Rastreabilidade planejada: 8/8 requisitos selecionados têm rastreio documental; {len(counts['asvs_no_catalogo'])}/8 têm subcasos no catálogo e {len(counts['asvs_documentais'])} são documentais (8.1.1 e 8.1.2).",
        f"Rastreabilidade executada: {len(counts['asvs_executados'])}/8 ({pct(len(counts['asvs_executados']), 8)}), requisitos {', '.join(counts['asvs_executados'])}.",
        "A seleção parcial não verifica nível ASVS nem permite afirmar conformidade integral.",
        "",
        "## 6. Alcance efetivo de revogação e isolamento",
        "",
        "AT-20 executou apenas a consulta administrativa e a criação/leitura de curso.",
        "O PATCH de papel, a persistência USER/ADMIN e o comportamento do token anterior e da nova sessão não foram executados;",
        "8.3.2 permanece sem validação executada.",
        "AT-19 executou restrições por papel em instituições; a fronteira entre I1 e I2 depende de P11 e não foi especificada.",
        "8.4.1 permanece sem validação executada; nenhum requisito recebeu cobertura apenas por ser citado.",
        "",
        "## 7. Limitações",
        "",
    ]
    lines.extend(f"- {item}" for item in data["limitacoes"])
    lines.extend([
        "",
        "## Fontes consultadas nesta seção",
        "",
        "- [OWASP ASVS 5.0.0, V8](https://github.com/OWASP/ASVS/blob/v5.0.0/5.0/en/0x17-V8-Authorization.md).",
        "- Registros locais listados na tabela de fontes; nenhum segredo ou token é reproduzido.",
        "",
    ])
    return "\n".join(lines)


def main():
    data = build()
    OUT_JSON.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    OUT_MD.write_text(render(data), encoding="utf-8")
    counts = data["contagens"]
    print(f"Ledger conferido com o relatório: {counts['testes_descobertos']} testes")
    print(f"Subcasos executados: {counts['subcasos_executados']} de {counts['subcasos_definidos']} definidos")
    for item in data["metricas"]:
        print(f"{item['id']}: {item['observado']} ({item['numerador']}/{item['denominador']})")
    print(f"Arquivos gerados: {OUT_JSON.relative_to(REPO)} e {OUT_MD.relative_to(REPO)}")


if __name__ == "__main__":
    main()
